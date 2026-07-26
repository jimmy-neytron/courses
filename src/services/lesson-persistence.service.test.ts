import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  createLessonBlockUpdatePayload,
  fingerprintLesson,
  fingerprintLessonBlock,
} from '@/services/lesson-persistence.service'
import type {
  Lesson,
  LessonBlock,
} from '@/types/course'

function audioBlock(
  overrides: Partial<LessonBlock> = {},
): LessonBlock {
  return {
    id: 'block-1',
    type: 'audio',
    title: 'Аудио',
    content: 'Прослушайте запись',
    required: true,
    schemaVersion: 1,
    ...overrides,
  }
}

describe('lesson persistence fingerprints', () => {
  it('ignores a temporary signed URL when storage path exists', () => {
    const first = audioBlock({
      audioPath: 'user/course/lesson/block/audio.mp3',
      audioUrl: 'https://signed.example/first',
    })

    const second = audioBlock({
      audioPath: 'user/course/lesson/block/audio.mp3',
      audioUrl: 'https://signed.example/second',
    })

    expect(fingerprintLessonBlock(first))
      .toBe(fingerprintLessonBlock(second))
  })

  it('tracks an external URL when storage path is absent', () => {
    const first = audioBlock({
      audioUrl: 'https://cdn.example/first.mp3',
    })

    const second = audioBlock({
      audioUrl: 'https://cdn.example/second.mp3',
    })

    expect(fingerprintLessonBlock(first))
      .not.toBe(fingerprintLessonBlock(second))
  })

  it('never places a quiz answer into public content', () => {
    const block: LessonBlock = {
      id: 'question-1',
      type: 'single_choice',
      title: 'Вопрос',
      content: 'Выберите вариант',
      required: true,
      schemaVersion: 1,
      options: ['A', 'B'],
      correctOption: 1,
      explanation: 'Потому что B',
    }

    const payload = createLessonBlockUpdatePayload(block)

    expect(payload.public_content)
      .not.toHaveProperty('correctOption')

    expect(payload.private_content)
      .toEqual({
        correctOption: 1,
        explanation: 'Потому что B',
      })
  })

  it('returns the same lesson fingerprint after reverting changes', () => {
    const lesson: Lesson = {
      id: 'lesson-1',
      title: 'Исходный заголовок',
      duration: 45,
      status: 'Черновик',
      blocks: [],
    }

    const saved = fingerprintLesson(lesson)

    lesson.title = 'Новый заголовок'
    lesson.title = 'Исходный заголовок'

    expect(fingerprintLesson(lesson)).toBe(saved)
  })
})
