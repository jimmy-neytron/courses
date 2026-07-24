export type CourseStatus = 'draft' | 'published' | 'archived'
export type CourseVisibility = 'private' | 'unlisted' | 'public'
export type LessonStatus = 'draft' | 'published' | 'archived'

export type LessonBlockType =
  | 'heading'
  | 'rich_text'
  | 'callout'
  | 'image'
  | 'audio'
  | 'video'
  | 'file'
  | 'vocabulary'
  | 'flashcards'
  | 'grammar'
  | 'example'
  | 'single_choice'
  | 'multiple_choice'
  | 'text_input'
  | 'fill_blanks'
  | 'matching'
  | 'ordering'
  | 'sentence_builder'
  | 'translation'
  | 'listening'
  | 'open_answer'
  | 'divider'
  | 'summary'
  | 'homework'

export interface LessonBlockContent {
  [key: string]: unknown
  text?: string
  url?: string
  caption?: string
  fileName?: string
}

export interface LessonBlock {
  id: string
  courseId: string
  lessonId: string
  blockType: LessonBlockType
  position: number
  title: string
  publicContent: LessonBlockContent
  privateContent: Record<string, unknown>
  settings: Record<string, unknown>
  isRequired: boolean
  points: number
  schemaVersion: number
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  courseId: string
  moduleId: string
  slug: string
  title: string
  description: string
  objectives: string[]
  durationMinutes: number
  passingScore: number
  position: number
  status: LessonStatus
  isPreview: boolean
  isCompleted: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  blocks: LessonBlock[]
}

export interface CourseModule {
  id: string
  courseId: string
  title: string
  description: string
  position: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  lessons: Lesson[]
}

export interface Course {
  id: string
  ownerId: string
  slug: string
  title: string
  description: string
  languageCode: string
  sourceLevel: string
  targetLevel: string
  durationWeeks: number | null
  lessonsPerWeek: number | null
  defaultLessonDuration: number
  coverPath: string | null
  accentColor: string
  status: CourseStatus
  visibility: CourseVisibility
  isSequential: boolean
  currentReleaseId: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  modules: CourseModule[]
}

export interface CourseDraft {
  title: string
  description: string
  languageCode: string
  sourceLevel: string
  targetLevel: string
  durationWeeks: number | null
  lessonsPerWeek: number | null
  defaultLessonDuration: number
  accentColor: string
  visibility: CourseVisibility
  isSequential: boolean
}

export interface CoursePatch extends Partial<CourseDraft> {
  status?: CourseStatus
  publishedAt?: string | null
}

export interface ModuleDraft {
  title: string
  description: string
}

export interface LessonDraft {
  title: string
  description: string
  objectives: string[]
  durationMinutes: number
  passingScore: number
}

export interface LessonPatch extends Partial<LessonDraft> {
  status?: LessonStatus
  position?: number
  isCompleted?: boolean
}

export interface BlockDraft {
  blockType: LessonBlockType
  title: string
  publicContent: LessonBlockContent
  isRequired: boolean
  points: number
}
