import test from "node:test"

import assert from "node:assert/strict"

import { readFile } from "node:fs/promises"

import { createRequire } from "node:module"

const require = createRequire(new URL("../package.json", import.meta.url))

const ts = require("typescript")

const url = (source) =>
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`

const compile = async (path) =>
  ts.transpileModule(await readFile(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText

const dataUrl = url(await compile("../src/data.ts"))

const { createEmptyState } = await import(dataUrl)

const serviceSource = (await compile("../src/service.ts")).replace(
  /from ["']\.\/data["']/g,
  `from "${dataUrl}"`,
)

let sequence = 0

async function fresh() {
  return (await import(url(serviceSource + `\n// instance ${sequence++}`))).api
}

const response = (data, status = 200, message = "") => ({
  ok: status < 400,
  status,
  json: async () => ({ success: status < 400, data, message }),
})

function state() {
  return {
    ...createEmptyState(),
    csrfToken: "csrf-one",
    products: [
      {
        id: "42",
        name: "Database product",
        brand: "Brand",
        category: "cpu",
        price: "100000.00",
        oldPrice: "120000.00",
        stock: 5,
        image: "/assets/images/cpu-intel.webp",
        specs: [],
        featured: true,
        status: "active",
      },
    ],

    shipping: { fee: "30000.00", freeFrom: "2000000.00" },
    coupons: [
      { code: "FROM-DATABASE", basisPoints: 500, maxDiscount: "500000.00" },
    ],
    carts: { guest: [] },
  }
}

test("starts empty and reads the server without consulting browser storage", async () => {
  const original = globalThis.fetch

  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("Browser storage must not be accessed")
    },
  })

  try {
    const calls = []

    globalThis.fetch = async (path, options) => {
      calls.push({ path, options })
      return response(state())
    }

    const api = await fresh()

    assert.equal(api.snapshot().ready, false)

    assert.deepEqual(api.snapshot().products, [])

    await api.refresh()

    assert.equal(api.snapshot().products[0].id, "42")

    assert.equal(api.snapshot().products[0].price, 100000)

    assert.equal(api.snapshot().shipping.fee, 30000)

    assert.equal(calls[0].path, "/api/store")

    assert.equal(calls[0].options.credentials, "same-origin")
  } finally {
    globalThis.fetch = original

    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor)
    else delete globalThis.localStorage
  }
})

test("a failed connection remains an explicit error and never creates sample data", async () => {
  const original = globalThis.fetch

  try {
    globalThis.fetch = async () => {
      throw new TypeError("offline")
    }

    const api = await fresh()

    await assert.rejects(api.refresh(), /Không thể kết nối/)

    assert.equal(api.snapshot().ready, false)

    assert.deepEqual(api.snapshot().products, [])

    assert.ok(api.snapshot().error)
  } finally {
    globalThis.fetch = original
  }
})

test("writes include CSRF and publish only the refreshed server state", async () => {
  const original = globalThis.fetch

  try {
    const wire = state()

    let mutation

    globalThis.fetch = async (path, options) => {
      if (options.method === "POST") {
        mutation = { path, options }

        wire.carts.guest = [{ productId: "42", quantity: 2 }]

        return response({ result: null, csrfToken: wire.csrfToken })
      }

      return response(structuredClone(wire))
    }

    const api = await fresh()

    await api.refresh()

    await api.addToCart("42", 2)

    assert.equal(mutation.path, "/api/store/cart-add")

    assert.equal(mutation.options.headers["X-CSRF-Token"], "csrf-one")

    assert.deepEqual(JSON.parse(mutation.options.body), {
      productId: "42",
      quantity: 2,
    })

    assert.equal(api.cart()[0].quantity, 2)
  } finally {
    globalThis.fetch = original
  }
})

test("a rejected write does not mutate cached products", async () => {
  const original = globalThis.fetch

  try {
    globalThis.fetch = async (_path, options) =>
      options.method === "POST"
        ? response(null, 403, "Không có quyền")
        : response(state())

    const api = await fresh()

    await api.refresh()

    const before = api.snapshot()

    await assert.rejects(api.deleteProduct("42"), /Không có quyền/)

    assert.strictEqual(api.snapshot(), before)
  } finally {
    globalThis.fetch = original
  }
})

test("quotes use database coupon settings instead of a built-in promotion", async () => {
  const original = globalThis.fetch

  try {
    const wire = state()
    wire.carts.guest = [{ productId: "42", quantity: 2 }]

    globalThis.fetch = async () => response(wire)

    const api = await fresh()

    await api.refresh()

    assert.equal(api.quote("FROM-DATABASE").discount, 10000)

    assert.equal(api.quote("TECHZONE5").discount, 0)

    assert.equal(api.quote("FROM-DATABASE").total, 220000)
  } finally {
    globalThis.fetch = original
  }
})

test("list requests preserve server pagination and normalize decimal prices", async () => {
  const original = globalThis.fetch

  try {
    let requested

    globalThis.fetch = async (path) => {
      requested = path
      return response({
        items: state().products,
        pagination: { page: 2, perPage: 8, total: 25, totalPages: 4 },
      })
    }

    const api = await fresh()

    const result = await api.list("products", {
      q: "intel & amd",
      page: 2,
      perPage: 8,
    })

    assert.ok(requested.includes("q=intel+%26+amd"))

    assert.equal(result.pagination.total, 25)

    assert.equal(result.pagination.page, 2)

    assert.equal(result.items[0].price, 100000)
  } finally {
    globalThis.fetch = original
  }
})

test("an older refresh cannot restore private data after logout", async () => {
  const original = globalThis.fetch

  try {
    const signedIn = {
      ...state(),
      session: "7",
      users: [{ id: "7", name: "Member", role: "MEMBER", active: true }],
    }

    let release

    let reads = 0

    globalThis.fetch = async (_path, options) => {
      if (options.method === "POST")
        return response({ result: null, csrfToken: "signed-out-token" })

      reads += 1

      if (reads === 2)
        return new Promise((resolve) => {
          release = () => resolve(response(signedIn))
        })

      return response(
        reads === 1 ? signedIn : { ...state(), csrfToken: "signed-out-token" },
      )
    }

    const api = await fresh()

    await api.refresh()

    const older = api.refresh()

    await api.logout()

    release()

    await older

    assert.equal(api.snapshot().session, null)

    assert.deepEqual(api.snapshot().users, [])

    assert.equal(api.snapshot().csrfToken, "signed-out-token")
  } finally {
    globalThis.fetch = original
  }
})
