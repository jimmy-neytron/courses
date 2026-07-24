import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const sourceRoot = new URL('../src/', import.meta.url)
const sourcePath = sourceRoot.pathname
const files = []

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else files.push(path)
  }
}

await walk(sourcePath)

const allowedRootEntries = new Set([
  'app.vue',
  'assets',
  'components',
  'composables',
  'config',
  'constants',
  'env.d.ts',
  'layouts',
  'main.ts',
  'pages',
  'plugins',
  'router',
  'services',
  'stores',
  'types',
  'utils',
])
const obsoleteDirectories = ['app', 'entities', 'features', 'shared', 'widgets']
const violations = []

for (const entry of await readdir(sourcePath, { withFileTypes: true })) {
  if (!allowedRootEntries.has(entry.name)) {
    violations.push(`src/${entry.name}: элемент не относится к Nuxt-like структуре`)
  }
}

for (const directory of obsoleteDirectories) {
  if (existsSync(join(sourcePath, directory))) {
    violations.push(`src/${directory}: устаревший слой должен быть удалён`)
  }
}

for (const file of files) {
  if (!['.vue', '.ts'].includes(extname(file))) continue
  const content = await readFile(file, 'utf8')
  const shortPath = relative(sourcePath, file)

  if (/<(button|select|input|textarea)(\s|>)/i.test(content)) {
    violations.push(`${shortPath}: найден нативный form/control элемент`)
  }
  if (/@\/(entities|features|shared|widgets|app)\//.test(content)) {
    violations.push(`${shortPath}: найден импорт из удалённого слоя`)
  }
  if (content.split('\n').length > 330) {
    violations.push(`${shortPath}: файл длиннее 330 строк`)
  }
}

if (violations.length) {
  console.error(`Architecture check failed:\n${violations.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log(`Nuxt-like architecture check passed: ${files.length} files scanned.`)
