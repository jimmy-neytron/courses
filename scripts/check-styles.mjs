import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const srcRoot = join(root, 'src')
const globalStylesRoot = join(srcRoot, 'assets', 'styles')
const allowedGlobalStyles = new Set([
  'accessibility.css',
  'compact-ui-overrides.css',
  'reset.css',
  'theme.css',
  'tokens.css',
  'typography.css',
])

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const violations = []
const allFiles = walk(srcRoot)
const vueFiles = allFiles.filter((file) => extname(file) === '.vue')
const cssFiles = allFiles.filter((file) => extname(file) === '.css')
const referencedCss = new Set()

for (const file of vueFiles) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/<style([^>]*)src="([^"]+)"([^>]*)><\/style>/g)) {
    const attributes = `${match[1]} ${match[3]}`
    const cssPath = resolve(dirname(file), match[2])
    referencedCss.add(cssPath)

    if (!/\bscoped\b/.test(attributes)) {
      violations.push(`${relative(root, file)}: внешний style должен быть scoped`)
    }
    if (!existsSync(cssPath)) {
      violations.push(`${relative(root, file)}: не найден ${match[2]}`)
    }
  }

  if (/<style(?![^>]*\bsrc=)/.test(source)) {
    violations.push(`${relative(root, file)}: inline style-блок запрещён, вынесите CSS рядом с компонентом`)
  }
}

for (const file of cssFiles) {
  const source = readFileSync(file, 'utf8')
  const isGlobal = dirname(file) === globalStylesRoot

  if (/\@import\b/.test(source)) {
    violations.push(`${relative(root, file)}: CSS @import запрещён; импортируйте файл через TypeScript/Vue`)
  }

  if (isGlobal) {
    const name = basename(file)
    if (!allowedGlobalStyles.has(name)) {
      violations.push(`${relative(root, file)}: лишний глобальный stylesheet`)
    }
    if (name !== 'compact-ui-overrides.css' && /^\s*\.[a-z_-]/im.test(source)) {
      violations.push(`${relative(root, file)}: компонентный class-селектор запрещён в глобальном CSS`)
    }
    if (name === 'compact-ui-overrides.css') {
      for (const match of source.matchAll(/\.([a-z][\w-]*)/gi)) {
        if (!match[1].startsWith('cui-')) {
          violations.push(`${relative(root, file)}: overrides может изменять только .cui-* селекторы`)
          break
        }
      }
    }
  } else if (!referencedCss.has(resolve(file))) {
    violations.push(`${relative(root, file)}: stylesheet не подключён ни к одному Vue-компоненту`)
  }
}

for (const forbidden of ['index.css', 'shared.css', 'base.css', 'compact-ui.css']) {
  if (existsSync(join(globalStylesRoot, forbidden))) {
    violations.push(`src/assets/styles/${forbidden}: агрегирующий или смешанный файл должен быть удалён`)
  }
}

if (violations.length) {
  console.error(`Style architecture check failed:\n${violations.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log(`Style architecture check passed: ${vueFiles.length} Vue files, ${cssFiles.length} CSS files.`)
