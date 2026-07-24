export function linesToList(value: string): string[] {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function pluralize(value: number, forms: readonly [string, string, string]): string {
  const normalized = Math.abs(value) % 100
  const lastDigit = normalized % 10

  if (normalized > 10 && normalized < 20) return forms[2]
  if (lastDigit > 1 && lastDigit < 5) return forms[1]
  if (lastDigit === 1) return forms[0]
  return forms[2]
}
