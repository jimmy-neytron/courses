import { normalizeCourseAccent } from '@/constants/course'
import type {
  BlockDraft,
  Course,
  CourseDraft,
  CourseModule,
  Lesson,
  LessonBlock,
  LessonDraft,
  ModuleDraft,
} from '@/types/course'
import { createIsoTimestamp } from '@/utils/date'
import { createId, createSlug } from '@/utils/id'

export function createLocalCourse(ownerId: string, draft: CourseDraft): Course {
  const timestamp = createIsoTimestamp()
  return {
    id: createId(),
    ownerId,
    slug: createSlug(draft.title),
    title: draft.title.trim(),
    description: draft.description.trim(),
    languageCode: draft.languageCode.trim() || 'und',
    sourceLevel: draft.sourceLevel.trim(),
    targetLevel: draft.targetLevel.trim(),
    durationWeeks: draft.durationWeeks,
    lessonsPerWeek: draft.lessonsPerWeek,
    defaultLessonDuration: draft.defaultLessonDuration,
    coverPath: null,
    accentColor: normalizeCourseAccent(draft.accentColor),
    status: 'draft',
    visibility: draft.visibility,
    isSequential: draft.isSequential,
    currentReleaseId: null,
    publishedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    modules: [],
  }
}

export function createLocalModule(courseId: string, draft: ModuleDraft, position: number): CourseModule {
  const timestamp = createIsoTimestamp()
  return {
    id: createId(),
    courseId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    position,
    isPublished: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    lessons: [],
  }
}

export function createLocalLesson(
  courseId: string,
  moduleId: string,
  draft: LessonDraft,
  position: number,
): Lesson {
  const timestamp = createIsoTimestamp()
  return {
    id: createId(),
    courseId,
    moduleId,
    slug: createSlug(draft.title),
    title: draft.title.trim(),
    description: draft.description.trim(),
    objectives: [...draft.objectives],
    durationMinutes: draft.durationMinutes,
    passingScore: draft.passingScore,
    position,
    status: 'draft',
    isPreview: false,
    isCompleted: false,
    publishedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    blocks: [],
  }
}

export function createLocalBlock(
  courseId: string,
  lessonId: string,
  draft: BlockDraft,
  position: number,
): LessonBlock {
  const timestamp = createIsoTimestamp()
  return {
    id: createId(),
    courseId,
    lessonId,
    blockType: draft.blockType,
    position,
    title: draft.title.trim(),
    publicContent: structuredClone(draft.publicContent),
    privateContent: {},
    settings: {},
    isRequired: draft.isRequired,
    points: draft.points,
    schemaVersion: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}
