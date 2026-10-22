import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const backend = join(root, 'backend')
const localPhp = join(root, '.tools', 'php', process.platform === 'win32' ? 'php.exe' : 'bin/php')
const php = process.env.PHP_BINARY || (existsSync(localPhp) ? localPhp : 'php')
const command = process.argv[2]
const localCommands = { 'init-local': 'init', 'start-db': 'start', 'stop-db': 'stop' }

if (localCommands[command]) {
  if (process.platform !== 'win32') {
    console.error('This local MySQL helper targets Windows. Use your MySQL 8 server and backend/.env on other systems.')
    process.exit(1)
  }
  const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
    join(root, 'scripts', 'local-mysql.ps1'), '-Action', localCommands[command]], { cwd: root, stdio: 'inherit' })
  child.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
  child.on('exit', (code) => { process.exitCode = code ?? 1 })
} else {
  const version = spawnSync(php, ['-r', 'echo PHP_MAJOR_VERSION, ".", PHP_MINOR_VERSION;'], { encoding: 'utf8' })
  if (version.error || version.status !== 0 || version.stdout.trim() !== '8.3') {
    console.error('PHP 8.3 is required. Windows: npm run backend:setup. Or set PHP_BINARY to your PHP 8.3 executable.')
    process.exit(1)
  }
  if (command === 'serve') {
    await mkdir(join(backend, 'public', 'assets'), { recursive: true })
    await cp(join(root, 'frontend', 'public'), join(backend, 'public', 'assets'), { recursive: true })
  }
  async function phpFiles(directory) {
    const files = []
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'vendor') continue
      const target = join(directory, entry.name)
      if (entry.isDirectory()) files.push(...await phpFiles(target))
      else if (entry.name.endsWith('.php')) files.push(target)
    }
    return files
  }
  if (command === 'lint') {
    const files = [...await phpFiles(backend), ...await phpFiles(join(root, 'frontend', 'resources', 'views'))]
    for (const file of files) {
      const result = spawnSync(php, ['-l', file], { encoding: 'utf8' })
      if (result.status !== 0) { console.error(result.stdout, result.stderr); process.exit(1) }
    }
    console.log(`PHP syntax OK: ${files.length} files.`)
  } else {
    const port = process.env.BACKEND_PORT || '8000'
    if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid BACKEND_PORT.')
    const args = command === 'serve'
      ? ['-d', 'upload_max_filesize=5M', '-d', 'post_max_size=6M', '-S', `127.0.0.1:${port}`, '-t', join(backend, 'public'), join(backend, 'router.php')]
      : command === 'test' ? [join(backend, 'tests', 'run.php')]
      : command === 'test-db' ? [join(backend, 'tests', 'database.php')]
      : ['init', 'connection', 'doctor', 'migrate', 'seed', 'seed-store', 'create-admin'].includes(command) ? [join(backend, 'console.php'), command] : null
    if (!args) throw new Error('Unknown backend command.')
    const child = spawn(php, args, { cwd: backend, stdio: 'inherit' })
    child.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
    child.on('exit', (code) => { process.exitCode = code ?? 1 })
    process.on('SIGINT', () => child.kill('SIGINT'))
    process.on('SIGTERM', () => child.kill('SIGTERM'))
  }
}
