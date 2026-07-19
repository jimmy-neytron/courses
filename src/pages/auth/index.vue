<script setup lang="ts">
import { GraduationCap } from 'lucide-vue-next'
import AuthForm from '@/components/auth/AuthForm.vue'
</script>

<template>
  <main class="auth-page">
    <section class="auth-art">
      <div class="brand light"><span class="brand-mark"><GraduationCap /></span><strong>Курсор</strong></div>
      <div>
        <span>ПЛАТФОРМА ДЛЯ АВТОРОВ</span>
        <h1>Создавайте обучение, которое хочется проходить.</h1>
        <p>Курсы и интерактивные уроки в одном независимом пространстве.</p>
      </div>
    </section>
    <section class="auth-form"><AuthForm /></section>
  </main>
</template>
