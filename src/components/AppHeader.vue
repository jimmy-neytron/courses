<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import PrimeButton from 'primevue/button'
import { LogOut, Menu } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

defineProps<{title:string}>()
const auth=useAuthStore()
const ui=useUiStore()
const router=useRouter()
const initials=computed(()=>String(auth.user?.user_metadata?.display_name??auth.user?.email??'U').split(/[ @]/).filter(Boolean).slice(0,2).map(item=>item[0]?.toUpperCase()).join(''))
async function logout(){await auth.signOut();await router.replace('/auth')}
</script>

<template>
  <header class="app-header">
    <PrimeButton class="menu" severity="secondary" text rounded aria-label="Открыть меню" @click="ui.sidebarOpen=true"><Menu/></PrimeButton>
    <div class="workspace-copy"><p>Рабочее пространство</p><strong>{{auth.organization?.name??'Загрузка…'}}</strong></div>
    <div class="header-title">{{title}}</div>
    <Avatar :label="initials" shape="circle" class="header-avatar"/>
    <PrimeButton severity="secondary" text rounded aria-label="Выйти" title="Выйти" @click="logout"><LogOut/></PrimeButton>
  </header>
</template>
