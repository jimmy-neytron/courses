<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import FormField from '@/components/common/FormField.vue'
import SaveState from '@/components/common/SaveState.vue'
import { languageLevelOptions, languageOptions } from '@/data/course-templates'
import type { Course } from '@/types/course'

defineProps<{ course: Course; saved?: boolean }>()
defineEmits<{ save: [] }>()
</script>

<template>
  <section class="product-section product-settings">
    <div><span class="eyebrow">Настройки курса</span><h2>Основная информация</h2><p>Параметры используются в новых уроках и учебном плане.</p></div>
    <form @submit.prevent="$emit('save')">
      <FormField label="Название"><UiInput v-model="course.title" fluid /></FormField>
      <FormField label="Описание"><UiTextarea v-model="course.description" rows="5" auto-resize fluid /></FormField>
      <div class="course-settings-grid">
        <FormField v-if="course.kind === 'language'" label="Изучаемый язык">
          <UiSelect v-model="course.languageCode" :options="languageOptions" option-label="label" option-value="value" editable fluid />
        </FormField>
        <FormField label="Длительность нового урока, минут">
          <UiInput type="number" v-model="course.defaultLessonDuration" :min="5" :max="300" suffix=" мин" fluid />
        </FormField>
      </div>
      <div v-if="course.kind === 'language'" class="course-settings-grid">
        <FormField label="Начальный уровень"><UiSelect v-model="course.sourceLevel" :options="languageLevelOptions" fluid /></FormField>
        <FormField label="Целевой уровень"><UiSelect v-model="course.targetLevel" :options="languageLevelOptions" fluid /></FormField>
      </div>
      <div><UiButton type="submit"><Save />Сохранить изменения</UiButton><SaveState :saved="saved" /></div>
    </form>
  </section>
</template>

<style scoped>
.course-settings-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
@media (max-width: 640px) { .course-settings-grid { grid-template-columns: 1fr; } }
</style>