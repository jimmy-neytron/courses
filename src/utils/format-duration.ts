export function formatDuration(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (!hours) return `${minutes} мин`
  if (!minutes) return `${hours} ч`

  return `${hours} ч ${minutes} мин`
}
