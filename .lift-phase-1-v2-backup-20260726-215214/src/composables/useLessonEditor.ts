import {
  computed,
  nextTick,
  reactive,
  ref,
  watch,
} from 'vue'
import { useRoute } from 'vue-router'
import {
  normalizeRichText,
  richTextToPlainText,
} from '@/components/common/richText'
import {
  createLessonSectionConfig,
  resolveLessonBlockSection,
} from '@/composables/useCourseSections'
import { useTransientFlag } from '@/composables/useTransientFlag'
import { filterLessonBlockCatalog } from '@/data/lesson-block-catalog'
import { useCourseStore } from '@/stores/courses'
import { useNotificationStore } from '@/stores/notifications'
import type {
  BlockType,
  Lesson,
  LessonBlock,
  LessonSectionConfig,
  LessonSectionId,
} from '@/types/course'

type SaveJob =
  | {
      kind: 'lesson'
      snapshot: string
      run: () => Promise<void>
    }
  | {
      kind: 'block'
      blockId: string
      snapshot: string
      run: () => Promise<void>
    }

function normalizeSnapshotValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeSnapshotValue)
  }

  if (value && typeof value === 'object') {
    const source = value as Record<string, unknown>

    return Object.keys(source)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const normalized = normalizeSnapshotValue(source[key])

        if (normalized !== undefined) {
          result[key] = normalized
        }

        return result
      }, {})
  }

  return value
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(normalizeSnapshotValue(value))
}

function serializeLesson(lesson: Lesson): string {
  return stableSerialize({
    title: lesson.title,
    duration: lesson.duration,
    status: lesson.status,
  })
}

function normalizedBlockContent(block: LessonBlock): string {
  if (
    block.type === 'heading'
    || block.type === 'single_choice'
  ) {
    return richTextToPlainText(block.content ?? '')
  }

  return normalizeRichText(block.content ?? '')
}

function serializeBlock(block: LessonBlock): string {
  const {
    audioUrl: _audioUrl,
    fileUrl: _fileUrl,
    ...persistedBlock
  } = block

  return stableSerialize({
    ...persistedBlock,
    content: normalizedBlockContent(block),
  })
}

export function useLessonEditor() {
  const route = useRoute()
  const store = useCourseStore()
  const notifications = useNotificationStore()

  const found = computed(() => (
    store.findLesson(String(route.params.lessonId))
  ))

  const blocks = computed<LessonBlock[]>({
    get: () => found.value?.lesson.blocks ?? [],
    set: (value) => {
      if (found.value) {
        found.value.lesson.blocks = value
      }
    },
  })

  const selectedId = ref('')
  const activeSectionId = ref<LessonSectionId>('')

  const selected = computed(() => (
    blocks.value.find((item) => item.id === selectedId.value)
    ?? blocks.value[0]
  ))

  const selectedIndex = computed(() => (
    selected.value
      ? blocks.value.findIndex(
          (item) => item.id === selected.value?.id,
        )
      : -1
  ))

  const addQuery = ref('')
  const insertAfterIndex = ref(-1)
  const insertSectionId = ref<LessonSectionId | ''>('')
  const sectionDraft = ref<LessonSectionConfig[]>([])

  const saving = ref(false)
  const orderSaving = ref(false)
  const uploading = ref(false)
  const sectionSaving = ref(false)

  const sectionsDialogOpen = ref(false)
  const blockOrderDialogOpen = ref(false)
  const blockPickerOpen = ref(false)
  const editorError = ref('')

  const savedLessonSnapshot = ref('')
  const savedBlockSnapshots = reactive(
    new Map<string, string>(),
  )

  const { value: saved, show: showSaved } = useTransientFlag(1200)

  const currentLessonSnapshot = computed(() => (
    found.value
      ? serializeLesson(found.value.lesson)
      : ''
  ))

  const dirtyBlockIds = computed(() => (
    blocks.value
      .filter((block) => (
        serializeBlock(block)
        !== savedBlockSnapshots.get(block.id)
      ))
      .map((block) => block.id)
  ))

  const dirty = computed(() => (
    currentLessonSnapshot.value !== savedLessonSnapshot.value
    || dirtyBlockIds.value.length > 0
  ))

  const courseKind = computed(() => (
    found.value?.course.kind ?? 'general'
  ))

  const pickerPalette = computed(() => (
    filterLessonBlockCatalog(addQuery.value, courseKind.value)
  ))

  const availableSections = computed(() => (
    createLessonSectionConfig(
      found.value?.lesson.sectionConfig,
      courseKind.value,
    )
  ))

  const selectedSectionId = computed(() => (
    selected.value
      ? resolveLessonBlockSection(
          selected.value,
          availableSections.value,
          courseKind.value,
        )
      : availableSections.value[0]?.id ?? 'content'
  ))

  const activeOrderSection = computed(() => (
    availableSections.value.find(
      (section) => section.id === activeSectionId.value,
    )
    ?? availableSections.value.find(
      (section) => section.id === selectedSectionId.value,
    )
    ?? availableSections.value[0]
  ))

  const orderBlocks = computed(() => (
    activeOrderSection.value
      ? blocks.value.filter((block) => (
          resolveLessonBlockSection(
            block,
            availableSections.value,
            courseKind.value,
          ) === activeOrderSection.value!.id
        ))
      : []
  ))

  const correctAnswerOptions = computed(() => (
    (selected.value?.options ?? []).map((option, index) => ({
      label: `${String.fromCharCode(65 + index)}. ${option}`,
      value: index,
    }))
  ))

  const isBusy = computed(() => (
    saving.value
    || orderSaving.value
    || uploading.value
    || sectionSaving.value
  ))

  function setError(
    error: unknown,
    fallback: string,
  ): void {
    editorError.value = error instanceof Error
      ? error.message
      : fallback

    notifications.error(editorError.value)
  }

  function captureBlockSnapshot(block: LessonBlock): void {
    savedBlockSnapshots.set(
      block.id,
      serializeBlock(block),
    )
  }

  function removeBlockSnapshot(blockId: string): void {
    savedBlockSnapshots.delete(blockId)
  }

  function captureSavedState(): void {
    const lesson = found.value?.lesson

    savedLessonSnapshot.value = lesson
      ? serializeLesson(lesson)
      : ''

    savedBlockSnapshots.clear()

    lesson?.blocks.forEach(captureBlockSnapshot)
  }

  watch(
    () => found.value?.lesson.id,
    () => {
      captureSavedState()
    },
    { immediate: true },
  )

  async function saveChanges(): Promise<boolean> {
    if (!found.value) return false
    if (!dirty.value) return true
    if (saving.value) return false

    const lessonId = found.value.lesson.id
    const jobs: SaveJob[] = []

    if (
      currentLessonSnapshot.value
      !== savedLessonSnapshot.value
    ) {
      const snapshot = currentLessonSnapshot.value

      jobs.push({
        kind: 'lesson',
        snapshot,
        run: () => store.saveLesson(lessonId),
      })
    }

    for (const blockId of dirtyBlockIds.value) {
      const block = blocks.value.find(
        (item) => item.id === blockId,
      )

      if (!block) continue

      const snapshot = serializeBlock(block)

      jobs.push({
        kind: 'block',
        blockId,
        snapshot,
        run: () => store.saveBlock(lessonId, blockId),
      })
    }

    if (!jobs.length) return true

    saving.value = true
    editorError.value = ''

    try {
      const results = await Promise.allSettled(
        jobs.map((job) => job.run()),
      )

      const failedResults: PromiseRejectedResult[] = []

      results.forEach((result, index) => {
        const job = jobs[index]

        if (!job) return

        if (result.status === 'rejected') {
          failedResults.push(result)
          return
        }

        if (job.kind === 'lesson') {
          savedLessonSnapshot.value = job.snapshot
        } else {
          savedBlockSnapshots.set(
            job.blockId,
            job.snapshot,
          )
        }
      })

      if (failedResults.length) {
        setError(
          failedResults[0]?.reason,
          failedResults.length === jobs.length
            ? 'Не удалось сохранить изменения'
            : 'Часть изменений не удалось сохранить',
        )

        return false
      }

      showSaved()
      notifications.success('Изменения сохранены')

      return true
    } finally {
      saving.value = false
    }
  }

  function openBlockPicker(
    afterIndex = selectedIndex.value,
    sectionId?: LessonSectionId,
  ): void {
    insertAfterIndex.value = Math.max(-1, afterIndex)
    insertSectionId.value = sectionId ?? ''
    addQuery.value = ''
    blockPickerOpen.value = true
  }

  async function addBlock(
    type: BlockType,
    afterIndex = selectedIndex.value,
    sectionId?: LessonSectionId,
  ): Promise<void> {
    if (!found.value) return

    const previousIds = new Set(
      blocks.value.map((item) => item.id),
    )

    const insertionIndex = Math.min(
      Math.max(afterIndex + 1, 0),
      blocks.value.length,
    )

    try {
      await store.addBlock(found.value.lesson.id, type)

      const addedBlock = blocks.value.find(
        (item) => !previousIds.has(item.id),
      )

      if (!addedBlock) return

      if (sectionId) {
        addedBlock.sectionId = sectionId

        await store.saveBlock(
          found.value.lesson.id,
          addedBlock.id,
        )
      }

      const currentIndex = blocks.value.findIndex(
        (item) => item.id === addedBlock.id,
      )

      if (currentIndex !== insertionIndex) {
        blocks.value.splice(currentIndex, 1)
        blocks.value.splice(insertionIndex, 0, addedBlock)

        await persistOrder()
      }

      captureBlockSnapshot(addedBlock)
      selectedId.value = addedBlock.id

      await nextTick()

      document
        .querySelector<HTMLElement>(
          `[data-block-id="${addedBlock.id}"]`,
        )
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
    } catch (error) {
      setError(error, 'Не удалось добавить блок')
    }
  }

  async function chooseBlock(type: BlockType): Promise<void> {
    blockPickerOpen.value = false

    await addBlock(
      type,
      insertAfterIndex.value,
      insertSectionId.value || undefined,
    )
  }

  async function persistOrder(): Promise<void> {
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

  async function saveBlockOrder(
    orderedBlocks: LessonBlock[],
  ): Promise<void> {
    if (!found.value || !activeOrderSection.value) return

    const queue = [...orderedBlocks]
    const sectionId = activeOrderSection.value.id

    blocks.value = blocks.value.map((block) => (
      resolveLessonBlockSection(
        block,
        availableSections.value,
        courseKind.value,
      ) === sectionId
        ? queue.shift() ?? block
        : block
    ))

    selectedId.value = (
      orderedBlocks[0]?.id
      ?? selected.value?.id
      ?? blocks.value[0]?.id
      ?? ''
    )

    await persistOrder()

    blockOrderDialogOpen.value = false
    notifications.success('Порядок блоков сохранён')
  }

  async function removeBlock(block: LessonBlock): Promise<void> {
    if (!found.value) return

    const index = blocks.value.findIndex(
      (item) => item.id === block.id,
    )

    selectedId.value = block.id
    editorError.value = ''

    try {
      await store.removeBlock(
        found.value.lesson.id,
        block.id,
      )

      removeBlockSnapshot(block.id)

      selectedId.value = (
        blocks.value[
          Math.min(index, blocks.value.length - 1)
        ]?.id
        ?? ''
      )

      notifications.success('Блок удалён')
    } catch (error) {
      setError(
        error,
        'Не удалось удалить блок и связанный файл',
      )
    }
  }

  async function removeSelectedBlock(): Promise<void> {
    if (selected.value) {
      await removeBlock(selected.value)
    }
  }

  function assignBlockSection(
    block: LessonBlock,
    sectionId: LessonSectionId,
  ): void {
    block.sectionId = sectionId
    selectedId.value = block.id
  }

  function assignSelectedSection(
    sectionId: LessonSectionId,
  ): void {
    if (!selected.value) return

    assignBlockSection(selected.value, sectionId)
  }

  function updateOptions(value?: string): void {
    if (!selected.value) return

    selected.value.options = (value ?? '')
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)

    if (
      (selected.value.correctOption ?? 0)
      >= selected.value.options.length
    ) {
      selected.value.correctOption = 0
    }
  }

  async function toggleLessonStatus(): Promise<void> {
    if (!found.value) return

    if (dirty.value) {
      const successfullySaved = await saveChanges()

      if (!successfullySaved) return
    }

    const previousStatus = found.value.lesson.status

    found.value.lesson.status = (
      previousStatus === 'Опубликован'
        ? 'Черновик'
        : 'Опубликован'
    )

    const statusSnapshot = serializeLesson(
      found.value.lesson,
    )

    try {
      await store.saveLesson(found.value.lesson.id)

      savedLessonSnapshot.value = statusSnapshot

      showSaved()

      notifications.success(
        found.value.lesson.status === 'Опубликован'
          ? 'Урок опубликован'
          : 'Урок возвращён в черновик',
      )
    } catch (error) {
      found.value.lesson.status = previousStatus
      setError(error, 'Не удалось изменить статус урока')
    }
  }

  async function uploadAudio(file: File): Promise<void> {
    if (!found.value || !selected.value) return

    const blockId = selected.value.id

    uploading.value = true

    try {
      await store.uploadAudio(
        found.value.lesson.id,
        blockId,
        file,
      )

      const block = blocks.value.find(
        (item) => item.id === blockId,
      )

      if (block) {
        captureBlockSnapshot(block)
      }

      showSaved()
      notifications.success('Аудио загружено')
    } catch (error) {
      setError(error, 'Не удалось загрузить аудио')
    } finally {
      uploading.value = false
    }
  }

  async function uploadPdf(file: File): Promise<void> {
    if (!found.value || !selected.value) return

    const blockId = selected.value.id

    uploading.value = true

    try {
      await store.uploadPdf(
        found.value.lesson.id,
        blockId,
        file,
      )

      const block = blocks.value.find(
        (item) => item.id === blockId,
      )

      if (block) {
        captureBlockSnapshot(block)
      }

      showSaved()
      notifications.success('PDF загружен')
    } catch (error) {
      setError(error, 'Не удалось загрузить PDF')
    } finally {
      uploading.value = false
    }
  }

  function openSections(): void {
    sectionDraft.value = createLessonSectionConfig(
      found.value?.lesson.sectionConfig,
      courseKind.value,
    )

    sectionsDialogOpen.value = true
  }

  async function saveSections(): Promise<void> {
    if (!found.value) return

    const nextSections = sectionDraft.value
      .map((section, order) => ({
        ...section,
        label: section.label.trim(),
        order,
      }))
      .filter((section) => section.label)

    if (!nextSections.length) {
      editorError.value = 'Нужен хотя бы один раздел'
      return
    }

    const removedIds = new Set(
      availableSections.value
        .filter((section) => (
          !nextSections.some(
            (item) => item.id === section.id,
          )
        ))
        .map((section) => section.id),
    )

    const fallbackId = nextSections[0]!.id

    const movedBlocks = blocks.value.filter((block) => (
      removedIds.has(
        resolveLessonBlockSection(
          block,
          availableSections.value,
          courseKind.value,
        ),
      )
    ))

    movedBlocks.forEach((block) => {
      block.sectionId = fallbackId
    })

    sectionSaving.value = true

    try {
      await Promise.all(
        movedBlocks.map((block) => (
          store.saveBlock(
            found.value!.lesson.id,
            block.id,
          )
        )),
      )

      await store.saveLessonSections(
        found.value.lesson.id,
        nextSections,
      )

      movedBlocks.forEach(captureBlockSnapshot)

      sectionsDialogOpen.value = false
      showSaved()
      notifications.success('Разделы урока сохранены')
    } catch (error) {
      setError(error, 'Не удалось сохранить разделы')
    } finally {
      sectionSaving.value = false
    }
  }

  return {
    found,
    blocks,
    activeSectionId,
    selectedId,
    selected,
    selectedIndex,

    addQuery,
    insertAfterIndex,
    insertSectionId,
    sectionDraft,

    saving,
    dirty,
    orderSaving,
    uploading,
    sectionSaving,

    sectionsDialogOpen,
    blockOrderDialogOpen,
    blockPickerOpen,

    editorError,
    saved,
    isBusy,

    pickerPalette,
    availableSections,
    selectedSectionId,
    activeOrderSection,
    orderBlocks,
    correctAnswerOptions,

    saveChanges,

    openBlockPicker,
    addBlock,
    chooseBlock,

    persistOrder,
    saveBlockOrder,

    removeBlock,
    removeSelectedBlock,

    assignBlockSection,
    assignSelectedSection,
    updateOptions,

    toggleLessonStatus,
    uploadAudio,
    uploadPdf,

    openSections,
    saveSections,
  }
}
