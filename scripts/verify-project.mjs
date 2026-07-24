import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const requiredFiles = [
  'package.json',
  'ARCHITECTURE.md',
  'src/app.vue',
  'src/main.ts',
  'src/router/index.ts',
  'src/router/routes.ts',
  'src/layouts/default.vue',
  'src/layouts/preview.vue',
  'src/assets/styles/tokens.css',
  'src/stores/courses/index.ts',
  'src/services/courses/course.repository.ts',
  'src/components/ui/app-dialog/AppDialog.vue',
  'src/components/ui/app-select/AppSelect.vue',
  'src/composables/useCourseForm.ts',
  'src/pages/courses/index.vue',
  'src/pages/courses/[courseId].vue',
  'src/pages/lessons/[lessonId]/editor.vue',
  'supabase/sql/02_course_content.sql',
  'supabase/sql/90_migrate_existing_to_courses_only.sql',
  'supabase/sql/91_migrate_accent_to_green.sql',
  'supabase/sql/92_add_lesson_completion.sql',
]

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) throw new Error(`Не найден обязательный файл: ${file}`)
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

const sourceFiles = walk(join(root, 'src')).filter((file) => ['.ts', '.vue'].includes(extname(file)))
const forbidden = [
  /\/app\/integrations/i,
  /\/app\/settings/i,
  /course_invites/i,
  /course_memberships/i,
  /integration_clients/i,
  /join_course_by_code/i,
  /regenerate_course_invite/i,
  /window\.(confirm|alert|prompt)\s*\(/,
  /<(select|option|button|input|textarea)\b/i,
]

for (const file of sourceFiles) {
  const source = readFileSync(file, 'utf8')
  for (const pattern of forbidden) {
    if (pattern.test(source)) {
      throw new Error(`Запрещённая конструкция найдена в ${relative(root, file)}: ${pattern}`)
    }
  }

  for (const match of source.matchAll(/(?:from\s+|import\s*)['"](@\/[^'"]+)['"]/g)) {
    const importPath = match[1].slice(2)
    const candidates = [
      join(root, 'src', importPath),
      join(root, 'src', `${importPath}.ts`),
      join(root, 'src', `${importPath}.vue`),
      join(root, 'src', importPath, 'index.ts'),
    ]

    if (!candidates.some(existsSync)) {
      throw new Error(`Не разрешается импорт ${match[1]} из ${relative(root, file)}`)
    }
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
if (!packageJson.dependencies?.['@neytron/compact-ui']) {
  throw new Error('@neytron/compact-ui не добавлен в dependencies')
}

const tokens = readFileSync(join(root, 'src/assets/styles/tokens.css'), 'utf8')
if (!tokens.includes('--app-accent: #00dc82')) {
  throw new Error('Основной зелёный цвет #00DC82 не настроен')
}

for (const page of [
  'src/pages/courses/[courseId].vue',
  'src/pages/lessons/[lessonId]/editor.vue',
  'src/pages/preview/courses/[courseId].vue',
  'src/pages/preview/lessons/[lessonId].vue',
]) {
  const source = readFileSync(join(root, page), 'utf8')
  if (!source.includes('LoadingSkeleton') || !source.includes('courses.loaded')) {
    throw new Error(`На странице ${page} нет корректного loading guard`)
  }
}

console.log('Project structure verification: OK')
