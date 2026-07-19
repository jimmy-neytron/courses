import { requireSupabase } from '@/services/supabase'

function accessErrorMessage(error: { message?: string }): string {
  if (error.message?.includes('COURSE_INVITE_NOT_FOUND')) return 'Курс с таким кодом не найден'
  if (error.message?.includes('COURSE_NOT_PUBLISHED')) return 'Автор ещё не опубликовал этот курс'
  if (error.message?.includes('join_course_by_code')) return 'Сначала выполните SQL-миграцию 10_course_access_roles.sql'
  return error.message || 'Не удалось присоединиться к курсу'
}

export async function joinCourseByCode(code: string): Promise<string> {
  const normalizedCode = code.trim().toUpperCase()
  if (!normalizedCode) throw new Error('Введите код курса')

  const { data, error } = await requireSupabase().rpc('join_course_by_code', {
    p_code: normalizedCode,
  })

  if (error) throw new Error(accessErrorMessage(error))
  return String(data)
}

export async function regenerateCourseInvite(courseId: string): Promise<string> {
  const { data, error } = await requireSupabase().rpc('regenerate_course_invite', {
    p_course_id: courseId,
  })

  if (error) throw new Error(error.message || 'Не удалось обновить код приглашения')
  return String(data)
}
