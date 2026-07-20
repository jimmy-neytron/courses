<script setup lang="ts">
import { Check, Copy, Database } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'

defineProps<{ organization?: string; email?: string; copied?: boolean }>()
defineEmits<{ copy: [] }>()
</script>

<template>
  <section class="integration-workspace is-compact">
    <article class="integration-primary-card">
      <div class="integration-card-topline"><span class="integration-live"><i />Подключено</span><small>Основной источник данных</small></div>
      <div class="integration-card-body">
        <span class="integration-symbol"><Database /></span>
        <div><h2>Supabase</h2><p>Данные и авторизация приложения</p></div>
        <UiButton severity="secondary" outlined @click="$emit('copy')"><Check v-if="copied" /><Copy v-else />{{ copied ? 'Скопировано' : 'Копировать endpoint' }}</UiButton>
      </div>
      <dl class="integration-facts">
        <div><dt>Пространство</dt><dd>{{ organization ?? 'Не определено' }}</dd></div>
        <div><dt>Владелец сессии</dt><dd>{{ email ?? 'Нет данных' }}</dd></div>
        <div><dt>Политика доступа</dt><dd>Row Level Security</dd></div>
      </dl>
    </article>

  </section>
</template>