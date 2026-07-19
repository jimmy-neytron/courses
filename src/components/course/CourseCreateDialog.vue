<script setup lang="ts">
import { reactive } from 'vue'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import AppModal from '@/components/AppModal.vue'
import FormField from '@/components/common/FormField.vue'

const emit = defineEmits<{
  close: []
  create: [input: { title: string; description: string }]
}>()

const form = reactive({ title: '', description: '' })

function submit(): void {
  const title = form.title.trim()
  if (!title) return
  emit('create', { title, description: form.description.trim() })
}
</script>

<template>
  <AppModal title="Новый курс" @close="emit('close')">
    <form class="form" @submit.prevent="submit">
      <FormField label="Название">
        <InputText v-model="form.title" autofocus placeholder="Например, Основы испанского" fluid />
      </FormField>
      <FormField label="Описание">
        <Textarea v-model="form.description" placeholder="Коротко расскажите о курсе" rows="5" auto-resize fluid />
      </FormField>
      <div class="form-actions">
        <PrimeButton type="button" severity="secondary" outlined @click="emit('close')">Отмена</PrimeButton>
        <PrimeButton type="submit" :disabled="!form.title.trim()">Создать курс</PrimeButton>
      </div>
    </form>
  </AppModal>
</template>
