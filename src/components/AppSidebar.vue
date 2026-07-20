<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMediaQuery } from '@vueuse/core'
import { BookOpen, GraduationCap, LogOut, Plug, Search, Settings } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useLayoutStore } from '@/stores/layout'
import { useCommandPalette } from '@/composables/useCommandPalette'

const auth = useAuthStore()
const layout = useLayoutStore()
const router = useRouter()
const commandPalette = useCommandPalette()
const isDesktop = useMediaQuery('(min-width: 761px)')
const navigation = [
  { to: '/app/courses', icon: BookOpen, label: 'Курсы' },
  { to: '/app/integrations', icon: Plug, label: 'Интеграции' },
]
const name = computed(() => String(auth.user?.user_metadata?.display_name ?? auth.user?.email ?? 'Пользователь'))
const initials = computed(() => name.value
  .split(/[ @]/)
  .filter(Boolean)
  .slice(0, 2)
  .map((item) => item[0]?.toUpperCase())
  .join(''))

watch(isDesktop, (desktop) => {
  if (desktop) layout.closeSidebar()
})

async function logout(): Promise<void> {
  await auth.signOut()
  layout.closeSidebar()
  await router.replace('/auth')
}
</script>

<template>
  <div v-if="layout.sidebarOpen" class="sidebar-overlay" @click="layout.closeSidebar" />
  <aside :class="['sidebar workspace-sidebar', layout.sidebarOpen && 'is-open']">
    <RouterLink to="/app" class="brand workspace-brand" @click="layout.closeSidebar">
      <span class="brand-mark"><GraduationCap :size="21" /></span>
      <span><strong>Курсор</strong><small>Course studio</small></span>
    </RouterLink>
    <p class="sidebar-label">Рабочее пространство</p>
    <nav>
      <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" @click="layout.closeSidebar">
        <component :is="item.icon" :size="18" /><span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <button class="sidebar-command" type="button" @click="commandPalette.show(); layout.closeSidebar()"><Search /><span>Быстрый поиск</span><kbd>Ctrl K</kbd></button>
    <div class="sidebar-bottom">
      <RouterLink to="/app/settings" @click="layout.closeSidebar"><Settings :size="18" /><span>Настройки</span></RouterLink>
      <div class="sidebar-account">
        <span class="sidebar-avatar" aria-hidden="true">{{ initials }}</span>
        <div><b>{{ name }}</b><small>{{ auth.organization?.name ?? 'Личное пространство' }}</small></div>
        <button aria-label="Выйти" title="Выйти" @click="logout"><LogOut /></button>
      </div>
    </div>
  </aside>
</template>