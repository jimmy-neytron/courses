<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiCard } from '@neytron/compact-ui/card'
import { UiInput } from '@neytron/compact-ui/input'

import { useAuthStore } from '@/stores/auth'
import { EyebrowText, FormField } from '@/components/ui'
import { getErrorMessage } from '@/utils/error'
import { useNotificationsStore } from '@/stores/notifications'

const auth = useAuthStore()
const notifications = useNotificationsStore()
const route = useRoute()
const router = useRouter()
const mode = ref<'sign-in' | 'sign-up'>('sign-in')
const email = ref('')
const password = ref('')
const displayName = ref('')

async function submit(): Promise<void> {
  try {
    if (mode.value === 'sign-in') await auth.signIn(email.value, password.value)
    else {
      await auth.signUp(email.value, password.value, displayName.value)
      notifications.push('Проверьте почту для подтверждения регистрации', 'success')
    }
    if (auth.isAuthenticated) await router.replace(String(route.query.redirect || '/app/courses'))
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Ошибка авторизации'), 'danger')
  }
}
</script>

<template>
  <main class="auth-page">
    <UiCard class="auth-card" variant="outline" padding="lg">
      <div class="auth-brand"><span><BookOpen :size="24" /></span><div><strong>Курсы</strong><small>Создание и редактирование</small></div></div>
      <header><EyebrowText>Supabase Auth</EyebrowText><h1>{{ mode === 'sign-in' ? 'Войти' : 'Создать аккаунт' }}</h1><p>Авторизуйтесь, чтобы работать с курсами.</p></header>
      <form class="auth-form" @submit.prevent="submit">
        <FormField v-if="mode === 'sign-up'" label="Имя"><UiInput v-model="displayName" autocomplete="name" /></FormField>
        <FormField label="Email"><UiInput v-model="email" type="email" autocomplete="email" /></FormField>
        <FormField label="Пароль"><UiInput v-model="password" type="password" :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'" /></FormField>
        <UiButton type="submit" block :loading="auth.loading">{{ mode === 'sign-in' ? 'Войти' : 'Зарегистрироваться' }}</UiButton>
      </form>
      <UiButton class="auth-mode-button" variant="ghost" block @click="mode = mode === 'sign-in' ? 'sign-up' : 'sign-in'">{{ mode === 'sign-in' ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти' }}</UiButton>
    </UiCard>
  </main>
</template>

<style scoped src="./auth.css"></style>
