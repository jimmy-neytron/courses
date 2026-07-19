<script setup lang="ts">
import { Save } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import FormField from '@/components/common/FormField.vue'
import SaveState from '@/components/common/SaveState.vue'
import type { Course } from '@/types/course'

defineProps<{ course: Course; saved?: boolean }>()
defineEmits<{ save: [] }>()
</script>

<template>
  <section class="product-section product-settings">
    <div><span class="eyebrow">Course settings</span><h2>Основная информация</h2><p>Изменения сохраняются в Supabase.</p></div>
    <form @submit.prevent="$emit('save')">
      <FormField label="Название"><InputText v-model="course.title" fluid /></FormField>
      <FormField label="Описание"><Textarea v-model="course.description" rows="5" auto-resize fluid /></FormField>
      <div><PrimeButton type="submit"><Save />Сохранить изменения</PrimeButton><SaveState :saved="saved" /></div>
    </form>
  </section>
</template>
