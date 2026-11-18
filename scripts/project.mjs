import { spawn, spawnSync } from 'node:child_process'
import { readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const [command, ...args] = process.argv.slice(2)
const help = 'run [--frontend|--backend] | add <migration_name> | update | check'
const children = new Set()
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  process.exitCode = code
  for (const child of children) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    else { try { process.kill(-child.pid, 'SIGTERM') } catch {} }
  }
}
function start(script, parameters = []) {
  const child = spawn(process.execPath, [join(root, 'scripts', script), ...parameters], {
    cwd: root, stdio: 'inherit', detached: process.platform !== 'win32',
  })
  children.add(child)
  child.on('error', (error) => { console.error(error.message); children.delete(child); stop(1) })
  child.on('exit', (code) => {
    children.delete(child)
    if (!stopping && code !== 0) stop(code ?? 1)
  })
}
process.on('SIGINT', () => stop(130))
process.on('SIGTERM', () => stop(143))
try {
  if (args.includes('--help') || command === '--help') {
    console.log(help)
  } else if (command === 'run') {
    if (args.length > 1 || (args.length && !['--frontend', '--backend'].includes(args[0]))) throw new Error(help)
    if (args[0] !== '--frontend') start('backend.mjs', ['serve'])
    if (args[0] !== '--backend') {
      process.env.BACKEND_URL ||= `http://127.0.0.1:${process.env.BACKEND_PORT || '8000'}`
      start('dev.mjs')
    }
  } else if (command === 'add') {
    if (args.length !== 1 || !/^[a-z][a-z0-9_]*$/.test(args[0]) || args[0].length > 100) throw new Error('Usage: add <snake_case_name> (max 100 characters)')
    const directory = join(root, 'backend', 'database', 'migrations')
    const files = await readdir(directory)
    const next = 1 + Math.max(0, ...files.map((name) => Number(name.match(/^(\d+)_.*\.sql$/)?.[1] || 0)))
    const name = `${String(next).padStart(3, '0')}_${args[0]}.sql`
    await writeFile(join(directory, name), `-- ${name}\n-- Add forward-only SQL here. Never edit an applied migration.\n`, { flag: 'wx' })
    console.log(`Created backend/database/migrations/${name}`)
  } else if (['update', 'check'].includes(command) && !args.length) {
    start('backend.mjs', [command === 'update' ? 'migrate' : 'migration-status'])
  } else throw new Error(help)
} catch (error) {
  console.error(error.message)
  stop(1)
}
