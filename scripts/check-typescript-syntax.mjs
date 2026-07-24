import { readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'
import ts from '/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'

const root = resolve(import.meta.dirname, '..')
const srcRoot = join(root, 'src')

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const diagnostics = []
for (const file of walk(srcRoot)) {
  const extension = extname(file)
  if (!['.ts', '.vue'].includes(extension)) continue

  const source = readFileSync(file, 'utf8')
  const script = extension === '.vue'
    ? [...source.matchAll(/<script\s+setup(?:\s+lang="ts")?[^>]*>([\s\S]*?)<\/script>/g)]
        .map((match) => match[1])
        .join('\n')
    : source

  if (!script.trim()) continue

  const sourceFile = ts.createSourceFile(
    relative(root, file),
    script,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  )

  for (const diagnostic of sourceFile.parseDiagnostics) {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    diagnostics.push(`${relative(root, file)}: ${message}`)
  }
}

if (diagnostics.length) {
  console.error(`TypeScript syntax check failed:\n${diagnostics.map((item) => `- ${item}`).join('\n')}`)
  process.exit(1)
}

console.log('TypeScript syntax check passed.')
