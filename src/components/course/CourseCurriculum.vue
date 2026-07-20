<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { BookOpen, ChevronDown, Clock3, CopyPlus, GripVertical, Plus } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import SaveState from '@/components/common/SaveState.vue'
import type { CourseModule } from '@/types/course'

const props = defineProps<{ modelValue: CourseModule[]; saving?: boolean; saved?: boolean; duplicatingId?: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: CourseModule[]]
  reorder: []
  addModule: []
  addLesson: [moduleId: string]
  duplicateModule: [moduleId: string]
  duplicateLesson: [moduleId: string, lessonId: string]
}>()

const modules = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>

<template>
  <section class="product-section">
    <div class="product-section-head">
      <div>
        <span class="eyebrow">Course builder</span>
        <h2>Структура курса</h2>
        <p>Перетаскивайте элементы или создавайте копии удачных уроков и модулей.</p>
      </div>
      <div class="product-save-state">
        <SaveState :saving="saving" :saved="saved" />
        <UiButton severity="secondary" outlined @click="emit('addModule')"><Plus />Новый модуль</UiButton>
      </div>
    </div>

    <VueDraggable v-model="modules" item-key="id" handle=".module-drag-handle" :animation="180" ghost-class="drag-ghost" :force-fallback="true" fallback-class="drag-fallback" chosen-class="drag-chosen" class="product-modules" @end="emit('reorder')">
      <article v-for="(module, moduleIndex) in modules" :key="module.id" class="product-module">
        <header>
          <button class="drag-handle module-drag-handle" aria-label="Переместить модуль"><GripVertical /></button>
          <span class="product-module-index">{{ String(moduleIndex + 1).padStart(2, '0') }}</span>
          <button class="product-module-title" @click="module.open = !module.open">
            <span><strong>{{ module.title }}</strong><small>{{ module.lessons.length }} уроков · {{ module.lessons.reduce((sum, lesson) => sum + lesson.duration, 0) }} минут</small></span>
            <ChevronDown :class="{ rotated: !module.open }" />
          </button>
          <UiButton
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
          <VueDraggable v-model="module.lessons" item-key="id" handle=".lesson-drag-handle" :group="{ name: 'course-lessons' }" :animation="180" ghost-class="drag-ghost" :force-fallback="true" fallback-class="drag-fallback" class="product-lessons-list" @end="emit('reorder')">
            <div v-for="(lesson, lessonIndex) in module.lessons" :key="lesson.id" class="product-lesson">
              <span class="drag-handle lesson-drag-handle" aria-label="Переместить урок"><GripVertical /></span>
              <RouterLink :to="`/app/lessons/${lesson.id}/editor`" class="product-lesson-link">
                <span class="product-lesson-index">{{ moduleIndex + 1 }}.{{ lessonIndex + 1 }}</span>
                <div><strong>{{ lesson.title }}</strong><small><Clock3 />{{ lesson.duration }} мин <span>·</span> {{ lesson.blocks.length }} блоков</small></div>
                <span :class="['product-status', lesson.status === 'Черновик' && 'is-draft']">{{ lesson.status }}</span>
              </RouterLink>
              <UiButton
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
          <button class="product-add-row" @click="emit('addLesson', module.id)"><Plus />Добавить урок в модуль</button>
        </div>
      </article>
    </VueDraggable>

    <button v-if="modules.length" class="product-add-module" @click="emit('addModule')">
      <Plus /><span><strong>Добавить следующий модуль</strong><small>Создайте новый этап программы</small></span>
    </button>
    <div v-else class="product-empty">
      <BookOpen /><h3>Начните с первого модуля</h3><p>Соберите программу из логичных этапов и добавьте уроки.</p>
      <UiButton @click="emit('addModule')"><Plus />Создать модуль</UiButton>
    </div>
  </section>
</template>