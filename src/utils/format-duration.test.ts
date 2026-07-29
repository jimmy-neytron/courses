import { describe, expect, it } from 'vitest'
import { formatDuration } from '@/utils/format-duration'

describe('formatDuration', () => {
  it.each([
    [0, '0 мин'],
    [45, '45 мин'],
    [60, '1 ч'],
    [135, '2 ч 15 мин'],
  ])('formats %i minutes as %s', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected)
  })
})
