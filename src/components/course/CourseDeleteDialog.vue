<script setup lang="ts">
import { ref, watch } from 'vue'
import { AlertTriangle, Trash2 } from 'lucide-vue-next'
import AppModal from '@/components/AppModal.vue'
import UiButton from '@/components/ui/button/UiButton.vue'
import type { Course } from '@/types/course'

const props = defineProps<{ course: Course; pending?: boolean; error?: string }>()
const emit = defineEmits<{ close: []; confirm: [] }>()
const confirmation = ref('')
watch(() => props.course.id, () => { confirmation.value = '' })
</script>

<template>
  <AppModal title="Удаление курса" @close="emit('close')">
    <div class="course-delete-dialog">
      <div class="course-delete-warning">
        <AlertTriangle />
        <div>
          <strong>Это действие нельзя отменить</strong>
          <p>Будут удалены курс, все модули, уроки, блоки и опубликованные версии.</p>
        </div>
      </div>
      <label>
        Для подтверждения введите название курса
        <b>{{ course.title }}</b>
        <input v-model="confirmation" autocomplete="off" :placeholder="course.title" />
      </label>
      <p v-if="error" class="product-alert is-error">{{ error }}</p>
      <div class="form-actions">
        <UiButton variant="secondary" :disabled="pending" @click="emit('close')">Отмена</UiButton>
        <UiButton variant="danger" :disabled="pending || confirmation !== course.title" @click="emit('confirm')">
          <Trash2 />{{ pending ? 'Удаляем…' : 'Удалить навсегда' }}
        </UiButton>
      </div>
    </div>
  </AppModal>
</template>