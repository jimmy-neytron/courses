<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import FormField from '@/components/common/FormField.vue'
import SaveState from '@/components/common/SaveState.vue'

defineProps<{ email: string; saved?: boolean }>()
const model = defineModel<string>({ required: true })
defineEmits<{ save: [] }>()
</script>

<template>
  <section class="product-settings-page">
    <article><span class="eyebrow">Personal profile</span><h2>Данные профиля</h2><p>Имя отображается в интерфейсе и сохраняется в Supabase Auth.</p></article>
    <form @submit.prevent="$emit('save')">
      <FormField label="Имя"><UiInput v-model="model" fluid /></FormField>
      <FormField label="Email"><UiInput :model-value="email" disabled fluid /></FormField>
      <div><UiButton type="submit"><Save />Сохранить</UiButton><SaveState :saved="saved" /></div>
    </form>
  </section>
</template>
