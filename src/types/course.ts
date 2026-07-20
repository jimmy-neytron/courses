export type CourseStatus = 'Опубликован' | 'Черновик'

export type CourseAccessRole = 'creator' | 'learner'

export type CourseKind = 'language' | 'general'

export type CourseTemplateId = 'blank-language' | 'blank-general'

export interface CourseCreateInput {
  templateId: CourseTemplateId
  kind: CourseKind
  title: string
  description: string
  languageCode?: string
  sourceLevel?: string
  targetLevel?: string
  durationWeeks?: number
  lessonsPerWeek?: number
  defaultLessonDuration: number
}

export interface CourseCreator {
  id: string
  name: string
  avatarUrl?: string
}

export interface CourseLearningPlan {
  durationWeeks: number
  sessionsPerWeek: number
  sessionMinutes: number
  totalSessions: number
  checkpointCount: number
  cadence: string
  outcome: string
}

export type BlockType =
  | 'heading'
  | 'text'
  | 'callout'
  | 'audio'
  | 'pdf'
  | 'grammar'
  | 'vocabulary'
  | 'practice'
  | 'conversation'
  | 'flashcards'
  | 'error_correction'
  | 'translation'
  | 'single_choice'

export type LessonSectionId = string

export interface LessonSectionConfig {
  id: LessonSectionId
  label: string
  visible: boolean
  order: number
}

export interface Flashcard {
  front: string
  back: string
  hint: string
}

export interface CorrectionItem {
  incorrect: string
  correct: string
  explanation: string
}

export interface LessonBlock {
  id: string
  type: BlockType
  title: string
  content: string
  required: boolean
  schemaVersion?: number
  sectionId?: LessonSectionId
  options?: string[]
  correctOption?: number
  explanation?: string
  audioUrl?: string
  audioPath?: string
  transcript?: string
  fileUrl?: string
  filePath?: string
  fileName?: string
  fileSize?: number
  cards?: Flashcard[]
  role?: string
  prompt?: string
  starter?: string
  sampleAnswer?: string
  corrections?: CorrectionItem[]
  sourceText?: string
  targetText?: string
  comprehensionQuestions?: string[]
}

export interface Lesson {
  id: string
  title: string
  duration: number
  status: CourseStatus
  blocks: LessonBlock[]
  sectionConfig?: LessonSectionConfig[]
  sectionConfigBlockId?: string
}

export interface CourseModule {
  id: string
  title: string
  open: boolean
  lessons: Lesson[]
}

export interface Course {
  id: string
  ownerId: string
  accessRole: CourseAccessRole
  creator: CourseCreator
  joinCode?: string
  kind: CourseKind
  languageCode?: string
  sourceLevel?: string
  targetLevel?: string
  defaultLessonDuration: number
  learningPlan?: CourseLearningPlan
  title: string
  description: string
  cover: string
  tag: string
  status: CourseStatus
  updated: string
  modules: CourseModule[]
}
