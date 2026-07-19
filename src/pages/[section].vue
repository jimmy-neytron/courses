<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Copy, Database, Mail, Save, ShieldCheck } from 'lucide-vue-next'
import DefaultLayout from '@/layouts/default.vue'
import UiButton from '@/components/ui/button/UiButton.vue'
import { useAuthStore } from '@/stores/auth'

const route=useRoute()
const auth=useAuthStore()
const section=computed(()=>String(route.params.section))
const titles={
  integrations:['Интеграции','Безопасное подключение внешних приложений.'],
  settings:['Настройки','Профиль и рабочее пространство.'],
} as const
const title=computed(()=>titles[section.value as keyof typeof titles]??titles.settings)
const copied=ref(false)
const saved=ref(false)
const profileName=ref('')

watch(()=>auth.user,()=>{profileName.value=String(auth.user?.user_metadata?.display_name??'')},{immediate:true})
async function saveProfile(){await auth.updateProfile(profileName.value);saved.value=true;setTimeout(()=>saved.value=false,1300)}
async function copyEndpoint(){await navigator.clipboard?.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1`);copied.value=true;setTimeout(()=>copied.value=false,1300)}
</script>

<template>
  <DefaultLayout>
    <div class="product-page">
      <div class="product-page-head"><div><span class="eyebrow">Workspace</span><h1>{{title[0]}}</h1><p>{{title[1]}}</p></div></div>
      <section v-if="section==='integrations'" class="product-integration">
        <div class="integration-symbol"><Database/></div>
        <div><span class="product-status">Подключено</span><h2>Supabase Data API</h2><p>Авторизация, Row Level Security и данные курсов работают через отдельный Supabase-проект.</p></div>
        <UiButton variant="secondary" @click="copyEndpoint"><component :is="copied?Check:Copy"/>{{copied?'Скопировано':'Копировать endpoint'}}</UiButton>
        <div class="integration-details">
          <article><ShieldCheck/><span><small>Безопасность</small><strong>RLS включён</strong></span></article>
          <article><Database/><span><small>Проект</small><strong>{{auth.organization?.name}}</strong></span></article>
          <article><Mail/><span><small>Аккаунт</small><strong>{{auth.user?.email}}</strong></span></article>
        </div>
      </section>
      <section v-else class="product-settings-page">
        <article><span class="eyebrow">Personal profile</span><h2>Данные профиля</h2><p>Имя отображается в интерфейсе и сохраняется в Supabase Auth.</p></article>
        <form @submit.prevent="saveProfile"><label>Имя<input v-model="profileName"/></label><label>Email<input :value="auth.user?.email??''" disabled/></label><div><UiButton type="submit"><Save/>Сохранить</UiButton><span v-if="saved" class="is-success"><Check/>Сохранено</span></div></form>
      </section>
    </div>
  </DefaultLayout>
</template>
