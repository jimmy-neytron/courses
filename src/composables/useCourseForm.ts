import { reactive, watch, type Ref } from 'vue'

import { createEmptyCourseDraft } from '@/constants/course'
import type { CourseDraft } from '@/types/course'

export function useCourseForm(open: Ref<boolean>, initial: Ref<CourseDraft | undefined>) {
  const form = reactive<CourseDraft>(createEmptyCourseDraft())

  watch([open, initial], ([isOpen, initialDraft]) => {
    if (!isOpen) return
    Object.assign(form, initialDraft ? structuredClone(initialDraft) : createEmptyCourseDraft())
  }, { immediate: true })

  function getDraft(): CourseDraft {
    return structuredClone(form)
  }

  return { form, getDraft }
}
