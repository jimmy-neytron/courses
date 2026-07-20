<script setup lang="ts">
import { reactive, watch } from 'vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import AppModal from '@/components/AppModal.vue'
import FormField from '@/components/common/FormField.vue'
import {
  courseTemplates,
  getCourseTemplate,
  languageLevelOptions,
  languageOptions,
} from '@/data/course-templates'
import type { CourseCreateInput } from '@/types/course'

const emit = defineEmits<{
  close: []
  create: [input: CourseCreateInput]
}>()

const form = reactive<CourseCreateInput>(structuredClone(courseTemplates[0]!.defaults))

watch(() => form.templateId, (templateId) => {
  Object.assign(form, structuredClone(getCourseTemplate(templateId).defaults))
})

function submit(): void {
  const title = form.title.trim()
  if (!title) return
  emit('create', {
    ...form,
    title,
    description: form.description.trim(),
    languageCode: form.kind === 'language' ? form.languageCode?.trim().toLowerCase() : undefined,
    sourceLevel: form.kind === 'language' ? form.sourceLevel : undefined,
    targetLevel: form.kind === 'language' ? form.targetLevel : undefined,
  })
}
</script>

<template>
  <AppModal title="Новый курс" @close="emit('close')">
    <form class="form course-create-form" @submit.prevent="submit">
      <FormField label="Основа курса">
        <UiSelect
          v-model="form.templateId"
          :options="courseTemplates"
          option-label="label"
          option-value="id"
          fluid
        />
      </FormField>

      <p class="course-template-description">{{ getCourseTemplate(form.templateId).description }}</p>

      <FormField label="Название">
        <UiInput
          v-model="form.title"
          autofocus
          :placeholder="form.kind === 'language' ? 'Например, Основы испанского' : 'Например, Основы фотографии'"
          fluid
        />
      </FormField>
      <FormField label="Описание">
        <UiTextarea
          v-model="form.description"
          placeholder="Коротко расскажите о курсе"
          rows="3"
          auto-resize
          fluid
        />
      </FormField>

      <div class="course-create-grid">
        <FormField v-if="form.kind === 'language'" label="Изучаемый язык">
          <UiSelect v-model="form.languageCode" :options="languageOptions" option-label="label" option-value="value" editable fluid />
        </FormField>
        <FormField label="Урок по умолчанию, минут">
          <UiInput type="number" v-model="form.defaultLessonDuration" :min="5" :max="300" fluid />
        </FormField>
      </div>

      <div v-if="form.kind === 'language'" class="course-create-grid">
        <FormField label="Начальный уровень">
          <UiSelect v-model="form.sourceLevel" :options="languageLevelOptions" fluid />
        </FormField>
        <FormField label="Целевой уровень">
          <UiSelect v-model="form.targetLevel" :options="languageLevelOptions" fluid />
        </FormField>
      </div>

      <div class="course-create-grid">
        <FormField label="Продолжительность, недель">
          <UiInput type="number" v-model="form.durationWeeks" :min="1" :max="104" fluid />
        </FormField>
        <FormField label="Занятий в неделю">
          <UiInput type="number" v-model="form.lessonsPerWeek" :min="1" :max="14" fluid />
        </FormField>
      </div>

      <div class="form-actions">
        <UiButton type="button" severity="secondary" outlined @click="emit('close')">Отмена</UiButton>
        <UiButton type="submit" :disabled="!form.title.trim()">Создать курс</UiButton>
      </div>
    </form>
  </AppModal>
</template>

<style scoped>
.course-create-form { gap: 1rem; }
.course-create-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
.course-template-option { display: grid; gap: .2rem; }
.course-template-option small, .course-template-description { color: var(--muted); }
.course-template-description { margin: -.4rem 0 0; font-size: .875rem; }
@media (max-width: 640px) { .course-create-grid { grid-template-columns: 1fr; } }
</style>