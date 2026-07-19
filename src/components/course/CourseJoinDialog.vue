<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound, LogIn } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import AppModal from '@/components/AppModal.vue'
import FormField from '@/components/common/FormField.vue'

defineProps<{ pending?: boolean; error?: string }>()
const emit = defineEmits<{ close: []; join: [code: string] }>()
const code = ref('')

function submit(): void {
  const normalized = code.value.trim().toUpperCase()
  if (normalized) emit('join', normalized)
}
</script>

<template>
  <AppModal title="Присоединиться к курсу" @close="emit('close')">
    <form class="form course-join-dialog" @submit.prevent="submit">
      <div class="course-dialog-intro">
        <KeyRound />
        <div><strong>Введите код автора</strong><p>После подключения курс появится в разделе «Я прохожу».</p></div>
      </div>
      <FormField label="Код приглашения">
        <InputText v-model="code" autofocus autocomplete="off" maxlength="12" placeholder="Например, A1B2C3D4E5" fluid />
      </FormField>
      <div v-if="error" class="product-alert is-error">{{ error }}</div>
      <div class="form-actions">
        <PrimeButton type="button" severity="secondary" outlined @click="emit('close')">Отмена</PrimeButton>
        <PrimeButton type="submit" :loading="pending" :disabled="!code.trim()"><LogIn />Добавить курс</PrimeButton>
      </div>
    </form>
  </AppModal>
</template>
