const allowedTags = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'BLOCKQUOTE'])
const inlineTags = new Set(['STRONG', 'B', 'EM', 'I', 'U', 'A'])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function plainTextToHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => '<p>' + escapeHtml(part).replace(/\n/g, '<br>') + '</p>')
    .join('')
}

function unwrap(element: Element): void {
  const parent = element.parentNode
  if (!parent) return
  while (element.firstChild) parent.insertBefore(element.firstChild, element)
  parent.removeChild(element)
}

function cleanNode(node: Node): void {
  if (node.nodeType !== Node.ELEMENT_NODE) return
  const element = node as Element
  Array.from(element.children).forEach(cleanNode)

  if (!allowedTags.has(element.tagName)) {
    unwrap(element)
    return
  }

  Array.from(element.attributes).forEach((attr) => element.removeAttribute(attr.name))
  if (element.tagName === 'A') {
    const href = (element as HTMLAnchorElement).href
    if (href && /^(https?:|mailto:|tel:)/i.test(href)) {
      element.setAttribute('href', href)
      element.setAttribute('target', '_blank')
      element.setAttribute('rel', 'noreferrer noopener')
    } else {
      unwrap(element)
    }
  }

  if (element.tagName === 'B') element.outerHTML = '<strong>' + element.innerHTML + '</strong>'
  if (element.tagName === 'I') element.outerHTML = '<em>' + element.innerHTML + '</em>'
}

export function normalizeRichText(value: string): string {
  const source = value.trim()
  if (!source) return ''
  const html = /<[a-z][\s\S]*>/i.test(source) ? source : plainTextToHtml(source)

  if (typeof document === 'undefined') return html
  const template = document.createElement('template')
  template.innerHTML = html
  Array.from(template.content.childNodes).forEach(cleanNode)

  const normalized = template.innerHTML.trim()
  if (!normalized) return ''
  if (inlineTags.has(template.content.firstElementChild?.tagName ?? '')) return '<p>' + normalized + '</p>'
  return normalized
}
