<script setup lang="ts">
import { ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { lessonBlockLabels } from '@/data/lesson-block-catalog'
import type { LessonBlock, LessonSectionConfig } from '@/types/course'

const props = defineProps<{
  blocks: LessonBlock[]
  section: LessonSectionConfig
  saving?: boolean
}>()

const emit = defineEmits<{ close: []; save: [blocks: LessonBlock[]]; select: [blockId: string] }>()
const draft = ref<LessonBlock[]>([])

watch(
  () => props.blocks,
  (blocks) => { draft.value = [...blocks] },
  { immediate: true },
)
</script>

<template>
  <UiModal :title="`Порядок блоков · ${section.label}`" @close="emit('close')">
    <div class="lesson-order-dialog">
      <p>Перетащите блоки внутри выбранного раздела. Остальные разделы урока не изменятся.</p>

      <VueDraggable
        v-if="draft.length"
        v-model="draft"
        item-key="id"
        handle=".block-order-handle"
        :animation="180"
        ghost-class="drag-ghost"
        chosen-class="drag-chosen"
        :force-fallback="true"
        class="block-order-list"
      >
        <article v-for="(block, index) in draft" :key="block.id" class="block-order-item is-section-only">
          <button class="drag-handle block-order-handle" type="button" aria-label="Перетащить блок"><GripVertical /></button>
          <span class="block-order-number">{{ String(index + 1).padStart(2, '0') }}</span>
          <button class="block-order-main" type="button" @click="emit('select', block.id)">
            <strong>{{ block.title || lessonBlockLabels[block.type] }}</strong>
            <small>{{ lessonBlockLabels[block.type] }}</small>
          </button>
        </article>
      </VueDraggable>

      <section v-else class="editor-section-empty">В этом разделе пока нет блоков</section>

      <div class="form-actions">
        <UiButton severity="secondary" outlined @click="emit('close')">Отмена</UiButton>
        <UiButton :disabled="saving || !draft.length" @click="emit('save', draft)">{{ saving ? 'Сохраняем…' : 'Сохранить порядок' }}</UiButton>
      </div>
    </div>
  </UiModal>
</template>