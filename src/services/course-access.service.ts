/**
 * The current compact database intentionally has no course_invites and
 * course_memberships tables. Keep the old public service API so every page from
 * commit 5d40d0c compiles, but report the unavailable feature explicitly when
 * the user invokes it.
 */
const unsupportedMessage =
  'Приглашения в курс временно недоступны: в текущей схеме удалены таблицы course_invites и course_memberships.'

export async function joinCourseByCode(code: string): Promise<string> {
  if (!code.trim()) throw new Error('Введите код курса')
  throw new Error(unsupportedMessage)
}

export async function regenerateCourseInvite(_courseId: string): Promise<string> {
  throw new Error(unsupportedMessage)
}
