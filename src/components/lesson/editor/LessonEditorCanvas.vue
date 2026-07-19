<script setup lang="ts">
import { computed } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical, MessageSquare, Plus } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import LessonAudioPlayer from '@/components/lesson/LessonAudioPlayer.vue'
import LessonPdfViewer from '@/components/lesson/LessonPdfViewer.vue'
import LessonBlockContextMenu from '@/components/lesson/editor/LessonBlockContextMenu.vue'
import { getLessonBlockCatalogItem, lessonBlockLabels } from '@/components/lesson/editor/lessonBlockCatalog'
import { resolveLessonBlockSection } from '@/composables/useCourseSections'
import type { Lesson, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

const props = defineProps<{ lesson: Lesson; sections: LessonSectionConfig[]; error?: string }>()
const blocks = defineModel<LessonBlock[]>('blocks', { required: true })
const selectedId = defineModel<string>('selectedId', { required: true })
const emit = defineEmits<{
  reorder: []
  addAt: [index?: number]
  assign: [block: LessonBlock, sectionId: LessonSectionId]
  remove: [block: LessonBlock]
  change: []
}>()

const selected = computed(() => blocks.value.find((item) => item.id === selectedId.value) ?? blocks.value[0])
const selectedIndex = computed(() => selected.value ? blocks.value.findIndex((item) => item.id === selected.value?.id) : -1)

function sectionLabel(block: LessonBlock): string {
  const sectionId = resolveLessonBlockSection(block)
  return props.sections.find((section) => section.id === sectionId)?.label ?? sectionId
}
</script>

<template>
  <main class="product-canvas">
    <div v-if="error" class="product-alert is-error">{{ error }}</div>
    <div class="editor-document-head">
      <div>
        <span>Урок · {{ lesson.duration }} минут · {{ blocks.filter((block) => block.type === 'single_choice').length }} вопросов</span>
        <InputText v-model="lesson.title" aria-label="Название урока" :spellcheck="false" @update:model-value="emit('change')" />
        <p>Выберите блок для редактирования справа. Перетаскивайте блоки за маркер слева.</p>
      </div>
      <button class="editor-document-add" @click="emit('addAt', selectedIndex)"><Plus />Добавить блок</button>
    </div>

    <VueDraggable
      v-model="blocks"
      item-key="id"
      handle=".block-drag-handle"
      :animation="180"
      ghost-class="drag-ghost"
      :force-fallback="true"
      chosen-class="drag-chosen"
      class="editor-block-list"
      @end="emit('reorder')"
    >
      <LessonBlockContextMenu
        v-for="(item, index) in blocks"
        :key="item.id"
        :block-label="lessonBlockLabels[item.type]"
        :block-number="index + 1"
        :sections="sections"
        :active-section-id="resolveLessonBlockSection(item)"
        @assign="sectionId => emit('assign', item, sectionId)"
        @add-below="emit('addAt', index)"
        @remove="emit('remove', item)"
      >
        <article
          :data-block-id="item.id"
          :class="['product-editor-block', selected?.id === item.id && 'is-selected']"
          @click="selectedId = item.id"
          @contextmenu="selectedId = item.id"
        >
          <button class="drag-handle block-drag-handle" aria-label="Переместить блок"><GripVertical /></button>
          <div class="editor-block-number">{{ String(index + 1).padStart(2, '0') }}</div>
          <div class="editor-block-content">
            <div class="editor-block-kicker"><span>{{ lessonBlockLabels[item.type] }}</span><small>{{ sectionLabel(item) }}</small></div>
            <h2 v-if="item.type === 'heading'">{{ item.content }}</h2>
            <p v-else-if="item.type === 'text'">{{ item.content }}</p>
            <aside v-else-if="item.type === 'callout'"><MessageSquare /><div><strong>{{ item.title }}</strong><p>{{ item.content }}</p></div></aside>
            <section v-else-if="['grammar','vocabulary','conversation','flashcards','error_correction','translation','practice'].includes(item.type)" class="editor-theory">
              <component :is="getLessonBlockCatalogItem(item.type).icon" />
              <div><strong>{{ item.title }}</strong><p>{{ item.content }}</p></div>
            </section>
            <LessonAudioPlayer v-else-if="item.type === 'audio'" :src="item.audioUrl" :title="item.title" :transcript="item.transcript" />
            <LessonPdfViewer v-else-if="item.type === 'pdf'" :url="item.fileUrl" :title="item.title" :file-name="item.fileName" :file-size="item.fileSize" />
            <div v-else class="editor-question">
              <strong>{{ item.content }}</strong>
              <span v-for="(option, optionIndex) in item.options" :key="`${option}-${optionIndex}`" :class="optionIndex === item.correctOption && 'is-correct'">
                {{ String.fromCharCode(65 + optionIndex) }}. {{ option }}
              </span>
              <small v-if="item.explanation">Разбор: {{ item.explanation }}</small>
            </div>
          </div>
          <button class="editor-block-quick-add" :aria-label="`Добавить блок после ${index + 1}`" title="Добавить блок ниже" @click.stop="emit('addAt', index)"><Plus /></button>
        </article>
      </LessonBlockContextMenu>
    </VueDraggable>

    <section v-if="!blocks.length" class="editor-empty">
      <Plus />
      <h2>Начните собирать урок</h2>
      <p>Добавьте теорию, практику, аудирование или тест.</p>
      <button @click="emit('addAt', -1)">Выбрать первый блок</button>
    </section>
    <button v-else class="editor-insert" @click="emit('addAt', blocks.length - 1)"><Plus />Добавить блок в конец урока</button>
  </main>
</template>
