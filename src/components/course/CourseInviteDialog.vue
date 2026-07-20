<script setup lang="ts">
import { computed } from 'vue'
import { Check, Copy, RefreshCw, UsersRound } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'
import UiButton from '@/components/ui/UiButton.vue'
import AppModal from '@/components/AppModal.vue'
import type { Course } from '@/types/course'

const props = defineProps<{ course: Course; refreshing?: boolean; error?: string }>()
const emit = defineEmits<{ close: []; regenerate: [] }>()
const code = computed(() => props.course.joinCode ?? '')
const { copy, copied } = useClipboard({ source: code })
</script>

<template>
  <AppModal title="Пригласить на курс" @close="emit('close')">
    <div class="course-invite-dialog">
      <div class="course-dialog-intro">
        <UsersRound />
        <div><strong>{{ course.title }}</strong><p>Отправьте код ученику. После ввода он получит доступ только к прохождению курса.</p></div>
      </div>
      <div v-if="code" class="course-invite-code">
        <small>Код приглашения</small>
        <strong>{{ code }}</strong>
        <UiButton severity="secondary" outlined @click="copy(code)">
          <Check v-if="copied" /><Copy v-else />{{ copied ? 'Скопировано' : 'Копировать' }}
        </UiButton>
      </div>
      <div v-else class="product-alert is-error">Сначала выполните SQL-миграцию ролей курса.</div>
      <div v-if="error" class="product-alert is-error">{{ error }}</div>
      <div class="form-actions">
        <UiButton severity="secondary" text :loading="refreshing" @click="emit('regenerate')"><RefreshCw />Создать новый код</UiButton>
        <UiButton @click="emit('close')">Готово</UiButton>
      </div>
    </div>
  </AppModal>
</template>
