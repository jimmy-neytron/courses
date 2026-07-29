import { describe, expect, it } from 'vitest'
import {
  buildCourseListItem,
  buildCourseManifest,
  type IntegrationCourseRow,
  type IntegrationReleaseRow,
} from './contract'

const course: IntegrationCourseRow = {
  id: 'course-1',
  title: 'English A2',
  current_release_id: 'release-1',
  default_lesson_duration: 45,
  accent_color: '#00DC82',
  updated_at: '2026-07-29T12:00:00Z',
}

const release: IntegrationReleaseRow = {
  id: 'release-1',
  course_id: 'course-1',
  version: 3,
  lesson_count: 2,
  published_at: '2026-07-29T12:00:00Z',
  snapshot: {
    schemaVersion: 1,
    course: {
      default_lesson_duration: 45,
      course_modules: [
        {
          id: 'module-2',
          title: 'Second',
          position: 1,
          is_published: true,
          lessons: [
            {
              id: 'lesson-2',
              title: 'Long lesson',
              position: 0,
              status: 'published',
              duration_minutes: 75,
            },
          ],
        },
        {
          id: 'module-1',
          title: 'First',
          position: 0,
          is_published: true,
          lessons: [
            {
              id: 'draft',
              title: 'Draft',
              position: 0,
              status: 'draft',
              duration_minutes: 30,
            },
            {
              id: 'lesson-1',
              title: 'First lesson',
              position: 1,
              status: 'published',
              duration_minutes: 0,
            },
          ],
        },
      ],
    },
  },
}

describe('Courses integration contract', () => {
  it('maps the published course summary', () => {
    expect(
      buildCourseListItem(course, release),
    ).toMatchObject({
      id: 'course-1',
      releaseId: 'release-1',
      lessonCount: 2,
      defaultLessonDuration: 45,
      status: 'active',
    })
  })

  it('builds a stable manifest with published lessons only', () => {
    const manifest = buildCourseManifest(
      course,
      release,
      'https://courses.example',
    )

    expect(
      manifest.lessons.map((lesson) => lesson.id),
    ).toEqual(['lesson-1', 'lesson-2'])
    expect(manifest.lessons[0]).toMatchObject({
      durationMinutes: 45,
      url: 'https://courses.example/preview/lessons/lesson-1',
    })
    expect(manifest.lessons[1]?.durationMinutes).toBe(75)
  })

  it('keeps the manifest pinned to the requested release', () => {
    const manifest = buildCourseManifest(
      course,
      release,
      'https://courses.example',
    )

    expect(manifest.course.releaseId).toBe('release-1')
    expect(manifest.course.releaseVersion).toBe(3)
  })
})
