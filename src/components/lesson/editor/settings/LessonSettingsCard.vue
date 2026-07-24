<script setup lang="ts">
import { UiCard } from '@neytron/compact-ui/card'
import { UiInput } from '@neytron/compact-ui/input'
import { UiTextarea } from '@neytron/compact-ui/textarea'

import type { LessonDraft } from '@/types/course'
import { EyebrowText, FormField } from '@/components/ui'

const form = defineModel<LessonDraft>({ required: true })
const objectivesText = defineModel<string>('objectivesText', { required: true })
</script>

<template>
  <UiCard variant="outline" padding="lg">
    <EyebrowText>Настройки урока</EyebrowText>
    <div class="lesson-settings-card__fields">
      <FormField label="Название"><UiInput v-model="form.title" /></FormField>
      <FormField label="Описание"><UiTextarea v-model="form.description" :rows="4" /></FormField>
      <FormField label="Цели, каждая с новой строки"><UiTextarea v-model="objectivesText" :rows="4" /></FormField>
      <FormField label="Длительность, минут"><UiInput v-model.number="form.durationMinutes" type="number" min="1" /></FormField>
      <FormField label="Проходной балл"><UiInput v-model.number="form.passingScore" type="number" min="0" max="100" /></FormField>
    </div>
  </UiCard>
</template>

<style scoped src="./lesson-settings-card.css"></style>
