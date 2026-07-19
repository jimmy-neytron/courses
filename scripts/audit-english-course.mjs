import { createServer } from 'vite'

const server = await createServer({
  appType: 'custom',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
})

try {
  const curriculum = await server.ssrLoadModule('/src/services/seed-english-90-day-course.ts')
  const course = curriculum.buildEnglish90DayDemoCourse()
  const audit = curriculum.auditEnglish90DayCourse(course)

  if (audit.issues.length) {
    throw new Error(`Course audit failed:\n${audit.issues.join('\n')}`)
  }

  process.stdout.write(`${JSON.stringify({
    course: course.title,
    phases: course.modules.length,
    ...audit,
  }, null, 2)}\n`)
} finally {
  await server.close()
}
