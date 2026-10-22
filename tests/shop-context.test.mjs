import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

const source = ts.transpileModule(
  await readFile(new URL("../src/shop-context.ts", import.meta.url), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText
const moduleUrl = (code) =>
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
let evaluation = 0

async function loadContext(hotModule) {
  // Substitute only Vite's HMR handle; exercise the real context implementation.
  const code = source
    .replace(/from ["']react["']/g, `from "${import.meta.resolve("react")}"`)
    .replaceAll("import.meta.hot", "testHot")
  return import(
    moduleUrl(
      `import { hot as testHot } from "${hotModule}";\n${code}\n// evaluation ${evaluation++}`,
    )
  )
}

function hotHarness(enabled = true) {
  return moduleUrl(
    `export const hot = ${
      enabled ? "{ data: {} }" : "undefined"
    };\n// harness ${evaluation++}`,
  )
}

function readThroughProvider(provider, useShop, value) {
  let received
  function Consumer() {
    received = useShop()
    return null
  }
  renderToStaticMarkup(
    createElement(provider, { value }, createElement(Consumer)),
  )
  return received
}

test("a consumer receives the exact provider value", async () => {
  const { ShopContext, useShop } = await loadContext(hotHarness())
  const shop = { db: {}, user: { id: "member-demo" } }
  assert.equal(readThroughProvider(ShopContext.Provider, useShop, shop), shop)
})

test("a consumer outside the provider still throws the original error", async () => {
  const { useShop } = await loadContext(hotHarness())
  function Consumer() {
    useShop()
    return null
  }
  assert.throws(() => renderToStaticMarkup(createElement(Consumer)), {
    message: "ShopProvider is missing.",
  })
})

test("repeated HMR evaluations retain the same context object in hot data", async () => {
  const harness = hotHarness()
  const { hot } = await import(harness)
  const first = await loadContext(harness)
  assert.equal(hot.data["techzone.shop-context"], first.ShopContext)
  for (let i = 0; i < 3; i++) {
    const updated = await loadContext(harness)
    assert.notEqual(updated.useShop, first.useShop)
    assert.equal(updated.ShopContext, first.ShopContext)
  }
})

test("old providers and updated hooks interoperate in both directions", async () => {
  const harness = hotHarness()
  const old = await loadContext(harness)
  const updated = await loadContext(harness)
  const shop = { db: {}, auth: true }
  assert.equal(
    readThroughProvider(old.ShopContext.Provider, updated.useShop, shop),
    shop,
  )
  assert.equal(
    readThroughProvider(updated.ShopContext.Provider, old.useShop, shop),
    shop,
  )
})

test("separate HMR sessions do not share context objects", async () => {
  const first = await loadContext(hotHarness())
  const second = await loadContext(hotHarness())
  assert.notEqual(first.ShopContext, second.ShopContext)
})

test("without HMR, modules create normal independent contexts defaulting to null", async () => {
  const harness = hotHarness(false)
  const first = await loadContext(harness)
  const second = await loadContext(harness)
  assert.notEqual(first.ShopContext, second.ShopContext)
  function Consumer() {
    first.useShop()
    return null
  }
  assert.throws(() => renderToStaticMarkup(createElement(Consumer)), {
    message: "ShopProvider is missing.",
  })
  const shop = { db: {} }
  assert.equal(
    readThroughProvider(first.ShopContext.Provider, first.useShop, shop),
    shop,
  )
})
