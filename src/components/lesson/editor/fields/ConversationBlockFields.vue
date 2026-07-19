<script setup lang="ts">
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import type { LessonBlock } from '@/types/course'

defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ change: [] }>()
</script>

<template>
  <section class="block-fieldset">
    <header><strong>Сценарий диалога</strong><small>Настройте роль собеседника и начало разговора</small></header>
    <label>Роль собеседника<InputText v-model="block.role" placeholder="Например, бариста" @update:model-value="emit('change')" /></label>
    <label>Задача ученика<Textarea v-model="block.prompt" rows="4" auto-resize placeholder="Что ученик должен сделать в диалоге" @update:model-value="emit('change')" /></label>
    <label>Первая реплика<InputText v-model="block.starter" placeholder="Hello! What can I get for you?" @update:model-value="emit('change')" /></label>
    <label>Пример ответа<Textarea v-model="block.sampleAnswer" rows="3" auto-resize @update:model-value="emit('change')" /></label>
  </section>
</template>
