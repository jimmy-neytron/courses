import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(process.argv[2] || process.cwd())
const required = [
  'package.json',
  'src/stores/auth.ts',
  'src/stores/courses.ts',
  'src/services/course-repository.service.ts',
  'src/services/course-access.service.ts',
]

const errors = []
for (const file of required) {
  if (!existsSync(join(root, file))) errors.push(`Отсутствует ${file}`)
}

if (!errors.length) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (packageJson.name !== 'course-platform') {
    errors.push(`Неожиданный package.json name: ${String(packageJson.name)}`)
  }

  const auth = readFileSync(join(root, 'src/stores/auth.ts'), 'utf8')
  const repository = readFileSync(join(root, 'src/services/course-repository.service.ts'), 'utf8')
  const access = readFileSync(join(root, 'src/services/course-access.service.ts'), 'utf8')

  const forbiddenRuntimePatterns = [
    [auth, /\.from\(['"]organization_members['"]\)/, 'auth.ts обращается к organization_members'],
    [repository, /\.eq\(['"]organization_id['"]/, 'repository фильтрует по удалённому organization_id'],
    [repository, /course_memberships/, 'repository выбирает course_memberships'],
    [repository, /course_invites/, 'repository выбирает course_invites'],
    [repository, /\.rpc\(['"]publish_course['"]/, 'repository вызывает удалённый publish_course'],
    [access, /\.rpc\(/, 'course-access вызывает удалённый RPC'],
  ]

  for (const [content, pattern, message] of forbiddenRuntimePatterns) {
    if (pattern.test(content)) errors.push(message)
  }
}

if (errors.length) {
  console.error('Проверка совместимости не пройдена:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log('Совместимый слой данных установлен корректно.')
