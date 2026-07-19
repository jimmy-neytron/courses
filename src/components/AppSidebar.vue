<script setup lang="ts">
import { computed, watch } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import Avatar from 'primevue/avatar'
import { BookOpen, GraduationCap, LayoutDashboard, Plug, Settings } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth=useAuthStore()
const ui=useUiStore()
const isDesktop=useMediaQuery('(min-width: 761px)')
const items=[
  {to:'/app',icon:LayoutDashboard,label:'Обзор'},
  {to:'/app/courses',icon:BookOpen,label:'Курсы'},
  {to:'/app/integrations',icon:Plug,label:'Интеграции'},
]
const name=computed(()=>String(auth.user?.user_metadata?.display_name??auth.user?.email??'Пользователь'))
const initials=computed(()=>name.value.split(/[ @]/).filter(Boolean).slice(0,2).map(item=>item[0]?.toUpperCase()).join(''))
watch(isDesktop,value=>{if(value)ui.sidebarOpen=false})
</script>

<template>
  <div v-if="ui.sidebarOpen" class="sidebar-overlay" @click="ui.sidebarOpen=false"/>
  <aside :class="['sidebar',ui.sidebarOpen&&'is-open']">
    <div class="brand"><span class="brand-mark"><GraduationCap :size="22"/></span><strong>Курсор</strong></div>
    <nav><RouterLink v-for="item in items" :key="item.to" :to="item.to" @click="ui.sidebarOpen=false"><component :is="item.icon" :size="19"/>{{item.label}}</RouterLink></nav>
    <div class="sidebar-bottom">
      <RouterLink to="/app/settings" @click="ui.sidebarOpen=false"><Settings :size="19"/>Настройки</RouterLink>
      <div class="profile"><Avatar :label="initials" shape="circle"/><div><b>{{name}}</b><small>{{auth.organization?.role??'Участник'}}</small></div></div>
    </div>
  </aside>
</template>
