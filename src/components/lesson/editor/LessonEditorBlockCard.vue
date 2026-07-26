<script setup lang="ts">
import { computed } from 'vue'
import { MessageSquare, Plus } from 'lucide-vue-next'
import LessonAudioPlayer from '@/components/lesson/player/LessonAudioPlayer.vue'
import LessonPdfViewer from '@/components/lesson/player/LessonPdfViewer.vue'
import LessonBlockContextMenu from '@/components/lesson/editor/LessonBlockContextMenu.vue'
import RichTextContent from '@/components/common/RichTextContent.vue'
import { richTextToPlainText } from '@/components/common/richText'
import { getLessonBlockCatalogItem, lessonBlockLabels } from '@/data/lesson-block-catalog'
import { resolveLessonBlockSection } from '@/composables/useCourseSections'
import type { CourseKind, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

const props = defineProps<{
  item: LessonBlock
  index: number
  selected?: boolean
  sections: LessonSectionConfig[]
  courseKind: CourseKind
}>()
const emit = defineEmits<{ select: []; assign: [sectionId: LessonSectionId]; addBelow: []; remove: [] }>()
const activeSectionId = computed(() => resolveLessonBlockSection(props.item, props.sections, props.courseKind))
const sectionLabel = computed(() => props.sections.find((section) => section.id === activeSectionId.value)?.label ?? activeSectionId.value)
</script>

<template>
  <LessonBlockContextMenu :block-label="lessonBlockLabels[item.type]" :block-number="index + 1" :sections="sections" :active-section-id="activeSectionId" @assign="emit('assign', $event)" @add-below="emit('addBelow')" @remove="emit('remove')">
    <article :data-block-id="item.id" :class="['product-editor-block', selected && 'is-selected']" @click="emit('select')" @contextmenu="emit('select')">
      <div class="editor-block-number">{{ String(index + 1).padStart(2, '0') }}</div>
      <div class="editor-block-content">
        <div class="editor-block-kicker"><span>{{ lessonBlockLabels[item.type] }}</span><small>{{ sectionLabel }}</small></div>
        <h2 v-if="item.type === 'heading'">
          {{ richTextToPlainText(item.content ?? '') }}
        </h2>
        <RichTextContent v-else-if="item.type === 'text'" :content="item.content" />
        <aside v-else-if="item.type === 'callout'"><MessageSquare /><div><strong>{{ item.title }}</strong><RichTextContent :content="item.content" /></div></aside>
        <section v-else-if="['grammar','vocabulary','conversation','flashcards','error_correction','translation','practice'].includes(item.type)" class="editor-theory">
          <component :is="getLessonBlockCatalogItem(item.type).icon" /><div><strong>{{ item.title }}</strong><RichTextContent :content="item.content" /></div>
        </section>
        <LessonAudioPlayer v-else-if="item.type === 'audio'" :src="item.audioUrl" :title="item.title" :transcript="item.transcript" />
        <LessonPdfViewer v-else-if="item.type === 'pdf'" :url="item.fileUrl" :title="item.title" :file-name="item.fileName" :file-size="item.fileSize" />
        <div v-else class="editor-question">
          <strong>
            {{ richTextToPlainText(item.content ?? '') }}
          </strong>
          <span v-for="(option, optionIndex) in item.options" :key="`${option}-${optionIndex}`" :class="optionIndex === item.correctOption && 'is-correct'">{{ String.fromCharCode(65 + optionIndex) }}. {{ option }}</span>
          <small v-if="item.explanation">Разбор: {{ item.explanation }}</small>
        </div>
      </div>
      <button class="editor-block-quick-add" :aria-label="`Добавить блок после ${index + 1}`" title="Добавить блок ниже" @click.stop="emit('addBelow')"><Plus /></button>
    </article>
  </LessonBlockContextMenu>
</template>
