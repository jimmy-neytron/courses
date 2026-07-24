export interface ProfileRow {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  locale: string
  timezone: string
  created_at: string
  updated_at: string
}

export interface CourseRow {
  id: string
  owner_id: string
  slug: string
  title: string
  description: string | null
  language_code: string
  source_level: string | null
  target_level: string | null
  duration_weeks: number | null
  lessons_per_week: number | null
  default_lesson_duration: number
  cover_path: string | null
  accent_color: string
  status: 'draft' | 'published' | 'archived'
  visibility: 'private' | 'unlisted' | 'public'
  is_sequential: boolean
  current_release_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CourseModuleRow {
  id: string
  course_id: string
  title: string
  description: string | null
  position: number
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface LessonRow {
  id: string
  course_id: string
  module_id: string
  slug: string
  title: string
  description: string | null
  objectives: string[] | null
  duration_minutes: number
  passing_score: number
  position: number
  status: 'draft' | 'published' | 'archived'
  is_preview: boolean
  is_completed: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface LessonBlockRow {
  id: string
  course_id: string
  lesson_id: string
  block_type: string
  position: number
  title: string | null
  public_content: Record<string, unknown> | null
  private_content: Record<string, unknown> | null
  settings: Record<string, unknown> | null
  is_required: boolean
  points: number
  schema_version: number
  created_at: string
  updated_at: string
}
