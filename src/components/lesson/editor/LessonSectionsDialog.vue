<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { GripVertical } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import AppModal from '@/components/AppModal.vue'
import type { LessonSectionConfig } from '@/types/course'

defineProps<{ saving?: boolean }>()
const sections = defineModel<LessonSectionConfig[]>({ required: true })
defineEmits<{ close: []; save: [] }>()
</script>

<template>
  <AppModal title="Разделы урока" @close="$emit('close')">
    <div class="lesson-section-settings">
      <p>Меняйте названия и порядок. Ненужные разделы можно выключить — материалы сохранятся.</p>
      <VueDraggable v-model="sections" item-key="id" handle=".section-drag-handle" :animation="160" class="lesson-section-list">
        <article v-for="section in sections" :key="section.id">
          <button class="drag-handle section-drag-handle" aria-label="Изменить порядок"><GripVertical /></button>
          <label><small>Название</small><InputText v-model="section.label" fluid /></label>
          <div><small>Доступен в уроке</small><ToggleSwitch v-model="section.visible" /></div>
        </article>
      </VueDraggable>
      <div class="form-actions"><PrimeButton severity="secondary" outlined @click="$emit('close')">Отмена</PrimeButton><PrimeButton :disabled="saving" @click="$emit('save')">{{ saving ? 'Сохраняем…' : 'Сохранить разделы' }}</PrimeButton></div>
    </div>
  </AppModal>
</template>
