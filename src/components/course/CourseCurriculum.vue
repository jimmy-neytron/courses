<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { BookOpen, CheckSquare2, ChevronDown, Clock3, CopyPlus, GripVertical, ListChecks, Plus, Square, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import SaveState from '@/components/common/SaveState.vue'
import type { CourseModule } from '@/types/course'

const props = defineProps<{
  modelValue: CourseModule[]
  saving?: boolean
  saved?: boolean
  duplicatingId?: string
  selectionMode?: boolean
  selectedLessonIds?: string[]
  deletingLessons?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: CourseModule[]]
  reorder: []
  addModule: []
  addLesson: [moduleId: string]
  duplicateModule: [moduleId: string]
  duplicateLesson: [moduleId: string, lessonId: string]
  toggleSelectionMode: []
  toggleLesson: [lessonId: string, extendRange?: boolean, forceSelect?: boolean]
  toggleModuleLessons: [moduleId: string]
  deleteSelected: []
}>()

const modules = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const selected = computed(() => new Set(props.selectedLessonIds ?? []))
const selectedCount = computed(() => selected.value.size)
let longPressTimer: number | undefined
let longPressTriggered = false

function isModuleSelected(module: CourseModule): boolean {
  return module.lessons.length > 0 && module.lessons.every((lesson) => selected.value.has(lesson.id))
}

function startLongPress(event: PointerEvent, lessonId: string): void {
  if (props.selectionMode || event.button !== 0) return
  window.clearTimeout(longPressTimer)
  longPressTriggered = false
  longPressTimer = window.setTimeout(() => {
    longPressTriggered = true
    emit('toggleLesson', lessonId, false, true)
    navigator.vibrate?.(20)
  }, 460)
}

function stopLongPress(): void {
  window.clearTimeout(longPressTimer)
  longPressTimer = undefined
}

function handleLessonClick(event: MouseEvent, lessonId: string): void {
  if (longPressTriggered) {
    event.preventDefault()
    longPressTriggered = false
    return
  }
  if (!props.selectionMode) return
  event.preventDefault()
  emit('toggleLesson', lessonId, event.shiftKey)
}

onBeforeUnmount(stopLongPress)
</script>

<template>
  <section class="product-section">
    <div class="product-section-head">
      <div>
        <span class="eyebrow">Course builder</span>
        <h2>Структура курса</h2>
        <p>Перетаскивайте элементы или создавайте копии удачных уроков и модулей.</p>
      </div>
      <div class="product-save-state curriculum-actions">
        <SaveState :saving="saving" :saved="saved" />
        <UiButton severity="secondary" outlined @click="emit('addModule')"><Plus />Новый модуль</UiButton>
      </div>
    </div>

    <div v-if="modules.some((module) => module.lessons.length)" :class="['curriculum-bulk-bar', { 'is-active': selectionMode }]">
      <div class="curriculum-bulk-copy">
        <span><ListChecks /></span>
        <div><strong>Управление уроками</strong><small>{{ selectionMode ? 'Клик — отметить · Shift + клик — выбрать диапазон' : 'Удерживайте урок или включите массовый выбор' }}</small></div>
      </div>
      <div class="curriculum-bulk-actions">
        <template v-if="selectionMode">
          <span class="curriculum-selected-count">Выбрано: {{ selectedCount }}</span>
          <UiButton severity="danger" :loading="deletingLessons" :disabled="!selectedCount" @click="emit('deleteSelected')"><Trash2 />Удалить выбранные</UiButton>
          <UiButton severity="secondary" outlined @click="emit('toggleSelectionMode')">Готово</UiButton>
        </template>
        <UiButton v-else severity="secondary" outlined @click="emit('toggleSelectionMode')"><ListChecks />Выбрать и удалить</UiButton>
      </div>
    </div>

    <VueDraggable v-model="modules" item-key="id" handle=".module-drag-handle" :disabled="selectionMode" :animation="180" ghost-class="drag-ghost" :force-fallback="true" fallback-class="drag-fallback" chosen-class="drag-chosen" class="product-modules" @end="emit('reorder')">
      <article v-for="(module, moduleIndex) in modules" :key="module.id" class="product-module">
        <header>
          <button v-if="!selectionMode" class="drag-handle module-drag-handle" aria-label="Переместить модуль"><GripVertical /></button>
          <button
            v-else
            class="curriculum-check curriculum-module-check"
            :class="{ 'is-selected': isModuleSelected(module) }"
            :disabled="!module.lessons.length"
            :aria-label="`Выбрать уроки модуля ${module.title}`"
            @click="emit('toggleModuleLessons', module.id)"
          ><CheckSquare2 v-if="isModuleSelected(module)" /><Square v-else /></button>
          <span class="product-module-index">{{ String(moduleIndex + 1).padStart(2, '0') }}</span>
          <button class="product-module-title" @click="module.open = !module.open">
            <span><strong>{{ module.title }}</strong><small>{{ module.lessons.length }} уроков · {{ module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0) }} минут</small></span>
            <ChevronDown :class="{ rotated: !module.open }" />
          </button>
          <UiButton
            v-if="!selectionMode"
            severity="secondary"
            text
            rounded
            size="small"
            class="curriculum-copy"
            :loading="duplicatingId === module.id"
            :disabled="Boolean(duplicatingId)"
            :aria-label="`Дублировать модуль ${module.title}`"
            title="Дублировать модуль"
            @click="emit('duplicateModule', module.id)"
          ><CopyPlus /></UiButton>
        </header>

        <div v-show="module.open" class="product-lessons">
          <VueDraggable v-model="module.lessons" item-key="id" handle=".lesson-drag-handle" :disabled="selectionMode" :group="{ name: 'course-lessons' }" :animation="180" ghost-class="drag-ghost" :force-fallback="true" fallback-class="drag-fallback" class="product-lessons-list" @end="emit('reorder')">
            <div v-for="(lesson, lessonIndex) in module.lessons" :key="lesson.id" :class="['product-lesson', { 'is-selecting': selectionMode, 'is-selected': selected.has(lesson.id) }]">
              <span v-if="!selectionMode" class="drag-handle lesson-drag-handle" aria-label="Переместить урок"><GripVertical /></span>
              <button v-else class="curriculum-check" :class="{ 'is-selected': selected.has(lesson.id) }" :aria-label="`Выбрать урок ${lesson.title}`" @click="emit('toggleLesson', lesson.id, $event.shiftKey)"><CheckSquare2 v-if="selected.has(lesson.id)" /><Square v-else /></button>
              <RouterLink :to="`/app/lessons/${lesson.id}/editor`" class="product-lesson-link" @pointerdown="startLongPress($event, lesson.id)" @pointerup="stopLongPress" @pointercancel="stopLongPress" @pointerleave="stopLongPress" @contextmenu.prevent @click.capture="handleLessonClick($event, lesson.id)">
                <span class="product-lesson-index">{{ moduleIndex + 1 }}.{{ lessonIndex + 1 }}</span>
                <div><strong>{{ lesson.title }}</strong><small><Clock3 />{{ lesson.duration }} мин <span>·</span> {{ lesson.blocks.length }} блоков</small></div>
                <span :class="['product-status', lesson.status === 'Черновик' && 'is-draft']">{{ lesson.status }}</span>
              </RouterLink>
              <UiButton
                v-if="!selectionMode"
                severity="secondary"
                text
                rounded
                size="small"
                class="curriculum-copy"
                :loading="duplicatingId === lesson.id"
                :disabled="Boolean(duplicatingId)"
                :aria-label="`Дублировать урок ${lesson.title}`"
                title="Дублировать урок"
                @click="emit('duplicateLesson', module.id, lesson.id)"
              ><CopyPlus /></UiButton>
            </div>
          </VueDraggable>
          <button v-if="!selectionMode" class="product-add-row" @click="emit('addLesson', module.id)"><Plus />Добавить урок в модуль</button>
        </div>
      </article>
    </VueDraggable>

    <button v-if="modules.length && !selectionMode" class="product-add-module" @click="emit('addModule')">
      <Plus /><span><strong>Добавить следующий модуль</strong><small>Создайте новый этап программы</small></span>
    </button>
    <div v-else-if="!modules.length" class="product-empty">
      <BookOpen /><h3>Начните с первого модуля</h3><p>Соберите программу из логичных этапов и добавьте уроки.</p>
      <UiButton @click="emit('addModule')"><Plus />Создать модуль</UiButton>
    </div>
  </section>
</template>