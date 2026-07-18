import { isSupabaseConfigured, requireSupabase } from '@/services/supabase'

const LESSON_ASSETS_BUCKET = 'lesson-assets'

export async function deleteLessonAssets(paths: Array<string | undefined>): Promise<void> {
  const storedPaths = [...new Set(paths.filter((path): path is string => Boolean(path)))]
  if (!isSupabaseConfigured || storedPaths.length === 0) return

  const { error } = await requireSupabase().storage.from(LESSON_ASSETS_BUCKET).remove(storedPaths)
  if (error) throw new Error(`Не удалось удалить файл урока: ${error.message}`)
}

export function releaseLessonObjectUrls(urls: Array<string | undefined>): void {
  urls.filter((url): url is string => Boolean(url?.startsWith('blob:'))).forEach((url) => URL.revokeObjectURL(url))
}
