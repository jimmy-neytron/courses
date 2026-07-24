const THEME = 'dark'
const DENSITY = 'compact'

export function configureTheme(): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.dataset.cuiTheme = THEME
  root.dataset.cuiDensity = DENSITY
  root.style.colorScheme = THEME
}
