import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Transpile in memory so the shared browser service can be tested without a server.
const compile = (source) => ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const dataUrl = moduleUrl(compile(await readFile(new URL("../src/data.ts", import.meta.url), "utf8")));
const source = compile(await readFile(new URL("../src/service.ts", import.meta.url), "utf8"))
  .replace(/from ["']\.\/data["']/g, `from "${dataUrl}"`);
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => store.set(key, value),
};
const { api } = await import(moduleUrl(source));
const { cmsGroups } = await import(dataUrl);
const member = () => api.login("member@techzone.vn", "Techzone123");
const admin = () => api.login("admin@techzone.vn", "Techzone123");
const shipping = { name: "Khách hàng demo", phone: "0901234567", address: "123 Nguyễn Văn Linh, Quận 7, TP HCM", note: "", coupon: "" };

test("TechZone shared mock service", async (suite) => {
  await suite.test("guest cannot checkout or access admin operations", async () => {
    await assert.rejects(api.checkout(shipping), /đăng nhập/);
    await assert.rejects(api.shipping(0, 0), /đăng nhập/);
  });
  await suite.test("invalid login is rejected without creating a session", async () => {
    await assert.rejects(api.login("member@techzone.vn", "wrong"), /không chính xác/);
    assert.equal(api.user(), undefined);
  });
  await suite.test("guest cart is merged on login", async () => {
    await api.addToCart("mouse", 2);
    await member();
    assert.equal(api.cart()[0].quantity, 2);
    assert.equal(api.snapshot().carts.guest.length, 0);
    assert.notEqual(api.user().passwordHash, "Techzone123");
  });
  await suite.test("shipping threshold applies after discount; discounts are capped", async () => {
    api.setQuantity("mouse", 0);
    await api.addToCart("keyboard");
    assert.equal(api.quote("TECHZONE5").shipping, 0);
    const thresholdCase = structuredClone(api.snapshot());
    thresholdCase.products.find((p) => p.id === "keyboard").price = 2100000;
    assert.equal(api.quote("TECHZONE5", thresholdCase).shipping, 30000);
    api.setQuantity("keyboard", 0);
    await api.addToCart("case");
    const product = api.snapshot().products.find((p) => p.id === "case");
    assert.equal(api.quote().shipping, 30000);
    assert.equal(api.quote("TECHZONE5").discount, Math.round(product.price * .05));
    api.setQuantity("case", 0);
    await api.addToCart("pc-gaming");
    assert.equal(api.quote("TECHZONE5").discount, 500000);
    api.setQuantity("pc-gaming", 0);
  });
  let firstOrder;
  let stock;
  await suite.test("checkout decrements stock and clears cart atomically", async () => {
    stock = api.snapshot().products.find((p) => p.id === "mouse").stock;
    await api.addToCart("mouse", 2);
    firstOrder = await api.checkout(shipping);
    assert.equal(api.snapshot().products.find((p) => p.id === "mouse").stock, stock - 2);
    assert.equal(api.cart().length, 0);
    const order = api.snapshot().orders.find((o) => o.id === firstOrder);
    assert.equal(order.total, 2 * 890000 + 30000);
    assert.equal(order.status, "pending");
    await assert.rejects(api.checkout(shipping), /trống/);
  });
  await suite.test("member cancellation restores stock exactly once", async () => {
    await api.orderStatus(firstOrder, "cancelled");
    assert.equal(api.snapshot().products.find((p) => p.id === "mouse").stock, stock);
    await assert.rejects(api.orderStatus(firstOrder, "cancelled"), /kết thúc/);
    assert.equal(api.snapshot().products.find((p) => p.id === "mouse").stock, stock);
  });
  await suite.test("member cannot cancel confirmed order; admin can cancel before shipping", async () => {
    await api.addToCart("mouse");
    const id = await api.checkout(shipping);
    await admin();
    await api.orderStatus(id, "confirmed");
    await member();
    await assert.rejects(api.orderStatus(id, "cancelled"), /không còn/);
    await admin();
    await api.orderStatus(id, "cancelled");
    assert.equal(api.snapshot().products.find((p) => p.id === "mouse").stock, stock);
  });
  await suite.test("admin cannot cancel after shipping or skip order states", async () => {
    await member();
    await api.addToCart("mouse");
    const id = await api.checkout(shipping);
    await admin();
    await assert.rejects(api.orderStatus(id, "delivered"), /không hợp lệ/);
    await api.orderStatus(id, "confirmed");
    await api.orderStatus(id, "shipping");
    await assert.rejects(api.orderStatus(id, "cancelled"), /không còn/);
    await api.orderStatus(id, "delivered");
    await assert.rejects(api.orderStatus(id, "confirmed"), /kết thúc/);
  });
  await suite.test("stock validation rejects over-ordering without changing cart", async () => {
    await member();
    const before = structuredClone(api.cart());
    await assert.rejects(api.addToCart("cpu-intel", 999), /tồn kho/);
    assert.deepEqual(api.cart(), before);
  });
  await suite.test("checkout rollback retains cart when stock changes", async () => {
    await member();
    await api.addToCart("cpu-intel", 2);
    await admin();
    const p = api.snapshot().products.find((p) => p.id === "cpu-intel");
    await api.saveProduct({ ...p, stock: 1 });
    await member();
    await assert.rejects(api.checkout(shipping), /không đủ tồn kho/);
    assert.equal(api.cart()[0].quantity, 2);
    assert.equal(api.snapshot().products.find((p) => p.id === "cpu-intel").stock, 1);
    api.setQuantity("cpu-intel", 0);
  });
  await suite.test("comments require moderation and contacts enter the inbox", async () => {
    await api.comment("news-1", "Nội dung bình luận kiểm thử");
    const comment = api.snapshot().content.comments[0];
    assert.equal(comment.status, "pending");
    await assert.rejects(api.saveContent("comments", { ...comment, status: "published" }), /không có quyền/);
    await api.contact("Khách demo", "demo@example.com", "Tôi cần tư vấn cấu hình PC.");
    assert.equal(api.snapshot().content.contacts[0].status, "new");
    await admin();
    await api.saveContent("comments", { ...comment, status: "published" });
    assert.equal(api.snapshot().content.comments[0].status, "published");
  });
  await suite.test("all nine approved CMS groups support create, edit and delete", async () => {
    assert.equal(Object.keys(cmsGroups).length, 9);
    for (const group of Object.keys(cmsGroups)) {
      await api.saveContent(group, { id: "", title: "Kiểm thử CMS", body: "Nội dung kiểm thử", extra: group === "pricing" ? "100000" : "", image: "", status: "published", createdAt: "" });
      const created = api.snapshot().content[group][0];
      await api.saveContent(group, { ...created, title: "Đã chỉnh sửa" });
      assert.equal(api.snapshot().content[group][0].title, "Đã chỉnh sửa");
      await api.deleteContent(group, created.id);
      assert.equal(api.snapshot().content[group].some((c) => c.id === created.id), false);
    }
  });
  await suite.test("configurable shipping changes the quote immediately", async () => {
    await api.shipping(45000, 3000000);
    await member();
    await api.addToCart("keyboard");
    assert.equal(api.quote().shipping, 45000);
    api.setQuantity("keyboard", 0);
    await admin();
    await api.shipping(30000, 2000000);
  });
  await suite.test("registration, unique email and order ownership are enforced", async () => {
    api.logout();
    await api.register("Thành viên mới", "new@example.com", "DemoPassword123");
    assert.equal(api.user().role, "MEMBER");
    assert.equal(api.user().email, "new@example.com");
    await assert.rejects(api.orderStatus(firstOrder, "cancelled"), /Không tìm thấy/);
    await assert.rejects(api.register("Trùng email", "new@example.com", "DemoPassword123"), /đã được đăng ký/);
  });
  await suite.test("persistent storage contains all saved changes", () => {
    const saved = JSON.parse(store.get("techzone.database.v1"));
    assert.equal(saved.orders.length, 3);
    assert.equal(saved.users.length, 3);
    assert.equal(saved.content.contacts.length, 1);
  });
});
