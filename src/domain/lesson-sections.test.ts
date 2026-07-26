import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  createLessonSectionConfig,
  resolveLessonBlockSection,
} from '@/domain/lesson-sections'

describe('lesson sections', () => {
  it('normalizes order without mutating the source', () => {
    const source = [
      {
        id: 'test',
        label: 'Тест',
        visible: true,
        order: 10,
      },
      {
        id: 'content',
        label: 'Материалы',
        visible: true,
        order: 2,
      },
    ]

    const result = createLessonSectionConfig(
      source,
      'general',
    )

    expect(result.map((section) => section.id))
      .toEqual(['content', 'test'])

    expect(result.map((section) => section.order))
      .toEqual([0, 1])

    expect(source[0]?.order).toBe(10)
  })

  it('places a quiz into the test section', () => {
    expect(
      resolveLessonBlockSection(
        {
          type: 'single_choice',
          sectionId: undefined,
        },
        undefined,
        'general',
      ),
    ).toBe('test')
  })
})
