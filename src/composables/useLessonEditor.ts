import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { createLessonSectionConfig, resolveLessonBlockSection } from '@/composables/useCourseSections'
import { useTransientFlag } from '@/composables/useTransientFlag'
import { filterLessonBlockCatalog } from '@/components/lesson/editor/lessonBlockCatalog'
import { useCourseStore } from '@/stores/courses'
import type { BlockType, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

export function useLessonEditor() {
  const route = useRoute()
  const store = useCourseStore()
  const found = computed(() => store.findLesson(String(route.params.lessonId)))
  const blocks = computed<LessonBlock[]>({
    get: () => found.value?.lesson.blocks ?? [],
    set: (value) => { if (found.value) found.value.lesson.blocks = value },
  })
  const selectedId = ref('')
  const selected = computed(() => blocks.value.find((item) => item.id === selectedId.value) ?? blocks.value[0])
  const selectedIndex = computed(() => selected.value ? blocks.value.findIndex((item) => item.id === selected.value?.id) : -1)
  const paletteQuery = ref('')
  const addQuery = ref('')
  const insertAfterIndex = ref(-1)
  const sectionDraft = ref<LessonSectionConfig[]>([])
  const saving = ref(false)
  const orderSaving = ref(false)
  const uploading = ref(false)
  const sectionSaving = ref(false)
  const sectionsDialogOpen = ref(false)
  const blockPickerOpen = ref(false)
  const editorError = ref('')
  const { value: saved, show: showSaved } = useTransientFlag(1200)

  const courseKind = computed(() => found.value?.course.kind ?? 'general')
  const filteredPalette = computed(() => filterLessonBlockCatalog(paletteQuery.value, courseKind.value))
  const pickerPalette = computed(() => filterLessonBlockCatalog(addQuery.value, courseKind.value))
  const availableSections = computed(() => createLessonSectionConfig(
    found.value?.lesson.sectionConfig,
    courseKind.value,
  ))
  const selectedSectionId = computed(() => selected.value
    ? resolveLessonBlockSection(selected.value, availableSections.value, courseKind.value)
    : availableSections.value[0]?.id ?? 'content')
  const correctAnswerOptions = computed(() => (selected.value?.options ?? []).map((option, index) => ({
    label: `${String.fromCharCode(65 + index)}. ${option}`,
    value: index,
  })))
  const isBusy = computed(() => saving.value || orderSaving.value || uploading.value)

  function setError(error: unknown, fallback: string) {
    editorError.value = error instanceof Error ? error.message : fallback
  }

  function openBlockPicker(afterIndex = selectedIndex.value) {
    insertAfterIndex.value = Math.max(-1, afterIndex)
    addQuery.value = ''
    blockPickerOpen.value = true
  }

  async function addBlock(type: BlockType, afterIndex = selectedIndex.value) {
    if (!found.value) return
    const previousIds = new Set(blocks.value.map((item) => item.id))
    const insertionIndex = Math.min(Math.max(afterIndex + 1, 0), blocks.value.length)
    try {
      await store.addBlock(found.value.lesson.id, type)
      const addedBlock = blocks.value.find((item) => !previousIds.has(item.id))
      if (!addedBlock) return
      const currentIndex = blocks.value.findIndex((item) => item.id === addedBlock.id)
      if (currentIndex !== insertionIndex) {
        blocks.value.splice(currentIndex, 1)
        blocks.value.splice(insertionIndex, 0, addedBlock)
        await persistOrder()
      }
      selectedId.value = addedBlock.id
      await nextTick()
      document.querySelector<HTMLElement>(`[data-block-id="${addedBlock.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch (error) {
      setError(error, 'Не удалось добавить блок')
    }
  }

  async function chooseBlock(type: BlockType) {
    blockPickerOpen.value = false
    await addBlock(type, insertAfterIndex.value)
  }

  const persistChanges = useDebounceFn(async () => {
    if (!found.value) return
    try {
      await store.saveLesson(found.value.lesson.id)
      if (selected.value) await store.saveBlock(found.value.lesson.id, selected.value.id)
      showSaved()
    } catch (error) {
      setError(error, 'Не удалось сохранить изменения')
    } finally {
      saving.value = false
    }
  }, 700)

  function scheduleSave() {
    saving.value = true
    void persistChanges()
  }

  async function persistOrder() {
    if (!found.value) return
    orderSaving.value = true
    try {
      await store.persistBlockOrder(found.value.lesson.id)
      showSaved()
    } catch (error) {
      setError(error, 'Не удалось сохранить порядок')
    } finally {
      orderSaving.value = false
    }
  }

  async function removeBlock(block: LessonBlock) {
    if (!found.value) return
    const index = blocks.value.findIndex((item) => item.id === block.id)
    selectedId.value = block.id
    editorError.value = ''
    try {
      await store.removeBlock(found.value.lesson.id, block.id)
      selectedId.value = blocks.value[Math.min(index, blocks.value.length - 1)]?.id ?? ''
    } catch (error) {
      setError(error, 'Не удалось удалить блок и связанный файл')
    }
  }

  async function removeSelectedBlock() {
    if (selected.value) await removeBlock(selected.value)
  }

  async function assignBlockSection(block: LessonBlock, sectionId: LessonSectionId) {
    if (!found.value) return
    const previousSectionId = block.sectionId
    block.sectionId = sectionId
    selectedId.value = block.id
    saving.value = true
    try {
      await store.saveBlock(found.value.lesson.id, block.id)
      showSaved()
    } catch (error) {
      block.sectionId = previousSectionId
      setError(error, 'Не удалось изменить раздел блока')
    } finally {
      saving.value = false
    }
  }

  function assignSelectedSection(sectionId: LessonSectionId) {
    if (selected.value) void assignBlockSection(selected.value, sectionId)
  }

  function updateOptions(value?: string) {
    if (!selected.value) return
    selected.value.options = (value ?? '').split('\n').map((item) => item.trim()).filter(Boolean)
    if ((selected.value.correctOption ?? 0) >= selected.value.options.length) selected.value.correctOption = 0
    scheduleSave()
  }

  async function publish() {
    if (!found.value) return
    found.value.lesson.status = 'Опубликован'
    await store.saveLesson(found.value.lesson.id)
    showSaved()
  }

  async function uploadAudio(file: File) {
    if (!found.value || !selected.value) return
    uploading.value = true
    try {
      await store.uploadAudio(found.value.lesson.id, selected.value.id, file)
      showSaved()
    } catch (error) {
      setError(error, 'Не удалось загрузить аудио')
    } finally {
      uploading.value = false
    }
  }

  async function uploadPdf(file: File) {
    if (!found.value || !selected.value) return
    uploading.value = true
    try {
      await store.uploadPdf(found.value.lesson.id, selected.value.id, file)
      showSaved()
    } catch (error) {
      setError(error, 'Не удалось загрузить PDF')
    } finally {
      uploading.value = false
    }
  }

  function openSections() {
    sectionDraft.value = createLessonSectionConfig(
      found.value?.lesson.sectionConfig,
      courseKind.value,
    )
    sectionsDialogOpen.value = true
  }

  async function saveSections() {
    if (!found.value) return
    sectionSaving.value = true
    try {
      await store.saveLessonSections(found.value.lesson.id, sectionDraft.value)
      sectionsDialogOpen.value = false
      showSaved()
    } catch (error) {
      setError(error, 'Не удалось сохранить разделы')
    } finally {
      sectionSaving.value = false
    }
  }

  return {
    found,
    blocks,
    selectedId,
    selected,
    selectedIndex,
    paletteQuery,
    addQuery,
    insertAfterIndex,
    sectionDraft,
    saving,
    orderSaving,
    uploading,
    sectionSaving,
    sectionsDialogOpen,
    blockPickerOpen,
    editorError,
    saved,
    isBusy,
    filteredPalette,
    pickerPalette,
    availableSections,
    selectedSectionId,
    correctAnswerOptions,
    openBlockPicker,
    addBlock,
    chooseBlock,
    scheduleSave,
    persistOrder,
    removeBlock,
    removeSelectedBlock,
    assignBlockSection,
    assignSelectedSection,
    updateOptions,
    publish,
    uploadAudio,
    uploadPdf,
    openSections,
    saveSections,
  }
}
