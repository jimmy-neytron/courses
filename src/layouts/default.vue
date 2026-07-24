<script setup lang="ts">
import { BookOpen, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { UiButton } from '@neytron/compact-ui/button'

import { useAuthStore } from '@/stores/auth'
import { useCoursesStore } from '@/stores/courses'
import { getErrorMessage } from '@/utils/error'
import { useNotificationsStore } from '@/stores/notifications'

const auth = useAuthStore()
const courses = useCoursesStore()
const notifications = useNotificationsStore()
const router = useRouter()

async function signOut(): Promise<void> {
  try {
    await auth.signOut()
    courses.reset()
    await router.replace({ name: 'auth' })
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось выйти'), 'danger')
  }
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <RouterLink class="app-brand" :to="{ name: 'courses' }">
        <span class="app-brand__mark"><BookOpen :size="20" /></span>
        <span><strong>Курсы</strong><small>Редактор материалов</small></span>
      </RouterLink>

      <nav class="app-navigation" aria-label="Основная навигация">
        <RouterLink :to="{ name: 'courses' }"><BookOpen :size="18" />Курсы</RouterLink>
      </nav>

      <div class="app-sidebar__footer">
        <div class="app-user">
          <span class="app-user__avatar">{{ auth.displayName.slice(0, 1).toUpperCase() }}</span>
          <span><strong>{{ auth.displayName }}</strong><small>{{ auth.isConfigured ? 'Supabase' : 'Локальный режим' }}</small></span>
        </div>
        <UiButton v-if="auth.isConfigured" variant="ghost" size="sm" aria-label="Выйти" @click="signOut"><LogOut :size="17" /></UiButton>
      </div>
    </aside>
    <main class="app-main"><RouterView /></main>
  </div>
</template>

<style scoped src="./default-layout.css"></style>
