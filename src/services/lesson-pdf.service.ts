import { isSupabaseConfigured, requireSupabase } from '@/services/supabase'

const BUCKET = 'lesson-assets'
const MAX_PDF_SIZE = 100 * 1024 * 1024

export function validatePdfFile(file: File): void {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) throw new Error('Можно загрузить только PDF-файл')
  if (file.size > MAX_PDF_SIZE) throw new Error('PDF должен быть не больше 100 МБ')
}
export async function createLessonPdfUrl(path: string): Promise<string> {
  if (!path || !isSupabaseConfigured) return ''
  const { data, error } = await requireSupabase().storage.from(BUCKET).createSignedUrl(path, 21600)
  if (error) throw error
  return data.signedUrl
}
export async function uploadLessonPdf(params: { organizationId:string; courseId:string; lessonId:string; blockId:string; file:File }): Promise<{ path:string; url:string; name:string; size:number }> {
  validatePdfFile(params.file)
  if (!isSupabaseConfigured) return { path: '', url: URL.createObjectURL(params.file), name: params.file.name, size: params.file.size }
  const path = `${params.organizationId}/${params.courseId}/${params.lessonId}/${params.blockId}/${crypto.randomUUID()}.pdf`
  const { error } = await requireSupabase().storage.from(BUCKET).upload(path, params.file, { cacheControl: '3600', contentType: 'application/pdf', upsert: true })
  if (error) throw error
  return { path, url: await createLessonPdfUrl(path), name: params.file.name, size: params.file.size }
}