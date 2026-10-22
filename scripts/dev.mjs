import { spawn } from 'node:child_process'
import { createConnection } from 'node:net'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const receivedArgs = process.argv.slice(2)
// Some Windows npm.ps1 shims consume --port but forward its numeric value.
const args = receivedArgs.length === 1 && /^\d+$/.test(receivedArgs[0])
  ? ['--port', receivedArgs[0]] : receivedArgs
const option = args.findIndex((arg) => arg === '--port')
const portArgument = args.find((arg) => arg.startsWith('--port='))?.slice(7)
const port = Number(option >= 0 ? args[option + 1] : portArgument || process.env.PORT || '8443')
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Invalid port. Use npm run dev -- --port 8444.')
  process.exit(1)
}
const occupied = await new Promise((resolve) => {
  const socket = createConnection({ host: '127.0.0.1', port })
  const done = (result) => { socket.destroy(); resolve(result) }
  socket.once('connect', () => done(true))
  socket.once('error', () => done(false))
  socket.setTimeout(1500, () => done(false))
})
if (occupied) {
  let sameProject = false
  try {
    const response = await fetch(`http://127.0.0.1:${port}/__techzone_dev`, { signal: AbortSignal.timeout(2500) })
    const metadata = await response.json()
    sameProject = response.ok && metadata.project === createHash('sha256').update(root).digest('hex')
  } catch { /* An unrelated listener must not be stopped or reused. */ }
  if (sameProject) {
    console.log(`TechZone is already running: http://localhost:${port}/`)
    console.log('PHP catalog: /products. Stop the existing dev server with Ctrl+C before restarting it.')
    process.exit(0)
  }
  console.error(`Port ${port} is in use by another server. Use npm run dev -- --port 8444, or stop that server first.`)
  process.exit(1)
}

// Start Vite from its workspace so configuration and plugins keep their normal behavior.
let vite
try {
  const require = createRequire(join(root, 'frontend', 'package.json'))
  vite = join(dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
} catch { /* Handle both pnpm workspace links and npm's hoisted installs. */ }
if (!vite || !existsSync(vite)) {
  console.error('Vite is missing. Run npx --yes pnpm@10.34.3 install --frozen-lockfile from the project root first.')
  process.exit(1)
}
const child = spawn(process.execPath, [vite, ...args], { cwd: join(root, 'frontend'), stdio: 'inherit' })
child.once('error', (error) => { console.error(error.message); process.exitCode = 1 })
child.once('exit', (code) => { process.exitCode = code ?? 1 })
process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
