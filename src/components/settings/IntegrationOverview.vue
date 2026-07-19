<script setup lang="ts">
import { Check, Copy, Database, Mail, ShieldCheck } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'

defineProps<{ organization?: string; email?: string; copied?: boolean }>()
defineEmits<{ copy: [] }>()
</script>

<template>
  <section class="product-integration">
    <div class="integration-symbol"><Database /></div>
    <div><span class="product-status">Подключено</span><h2>Supabase Data API</h2><p>Авторизация, Row Level Security и данные курсов работают через отдельный Supabase-проект.</p></div>
    <PrimeButton severity="secondary" outlined @click="$emit('copy')"><Check v-if="copied" /><Copy v-else />{{ copied ? 'Скопировано' : 'Копировать endpoint' }}</PrimeButton>
    <div class="integration-details">
      <article><ShieldCheck /><span><small>Безопасность</small><strong>RLS включён</strong></span></article>
      <article><Database /><span><small>Проект</small><strong>{{ organization }}</strong></span></article>
      <article><Mail /><span><small>Аккаунт</small><strong>{{ email }}</strong></span></article>
    </div>
  </section>
</template>
