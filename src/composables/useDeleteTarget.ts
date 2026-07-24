import { computed, ref } from 'vue'

export type DeleteTarget = {
  kind: 'course' | 'module' | 'lesson'
  id: string
  title: string
}

export function useDeleteTarget() {
  const target = ref<DeleteTarget | null>(null)
  const title = computed(() => {
    if (target.value?.kind === 'course') return 'Удалить курс?'
    if (target.value?.kind === 'module') return 'Удалить модуль?'
    return 'Удалить урок?'
  })
  const description = computed(() => {
    if (!target.value) return ''
    if (target.value.kind === 'course') return `Курс «${target.value.title}» и всё его содержимое будут удалены без возможности восстановления.`
    if (target.value.kind === 'module') return `Модуль «${target.value.title}» будет удалён вместе со всеми уроками и блоками.`
    return `Урок «${target.value.title}» и его блоки будут удалены.`
  })

  return {
    target,
    title,
    description,
    request: (kind: DeleteTarget['kind'], id: string, itemTitle: string) => { target.value = { kind, id, title: itemTitle } },
    clear: () => { target.value = null },
  }
}
