<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import UiModal from '@/components/ui/UiModal.vue'
import type { LessonSectionConfig } from '@/types/course'

defineProps<{ saving?: boolean }>()
const sections = defineModel<LessonSectionConfig[]>({ required: true })
defineEmits<{ close: []; save: [] }>()
function addSection(): void { sections.value.push({ id: `section-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, label: 'Новый раздел', visible: true, order: sections.value.length }) }
function removeSection(id: string): void { if (sections.value.length > 1) sections.value = sections.value.filter((section) => section.id !== id) }
</script>

<template>
  <UiModal title="Разделы урока" @close="$emit('close')">
    <div class="lesson-section-settings">
      <p>Добавляйте, переименовывайте и меняйте порядок разделов. Блоки удалённого раздела автоматически перейдут в первый.</p>
      <VueDraggable v-model="sections" item-key="id" handle=".section-drag-handle" :animation="160" class="lesson-section-list">
        <article v-for="section in sections" :key="section.id"><button class="drag-handle section-drag-handle" aria-label="Изменить порядок"><GripVertical /></button><label><small>Название</small><UiInput v-model="section.label" fluid /></label><div><small>Показывать</small><UiSwitch v-model="section.visible" /></div><UiButton severity="danger" text rounded size="small" :disabled="sections.length <= 1" aria-label="Удалить раздел" title="Удалить раздел" @click="removeSection(section.id)"><Trash2 /></UiButton></article>
      </VueDraggable>
      <UiButton severity="secondary" outlined class="lesson-section-add" @click="addSection"><Plus />Добавить раздел</UiButton>
      <div class="form-actions"><UiButton severity="secondary" outlined @click="$emit('close')">Отмена</UiButton><UiButton :disabled="saving" @click="$emit('save')">{{ saving ? 'Сохраняем…' : 'Сохранить разделы' }}</UiButton></div>
    </div>
  </UiModal>
</template>