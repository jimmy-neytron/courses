<script setup lang="ts">
import type { Course } from '@/types/course'

defineProps<{ course: Course; moduleCount: number; lessonCount: number; totalMinutes: number }>()
</script>

<template>
  <section class="product-section product-overview">
    <article><span>О курсе</span><h2>{{ course.title }}</h2><p>{{ course.description }}</p></article>
    <article>
      <span>Структура</span>
      <dl>
        <div><dt>Модулей</dt><dd>{{ moduleCount }}</dd></div>
        <div><dt>Уроков</dt><dd>{{ lessonCount }}</dd></div>
        <div><dt>Длительность</dt><dd>{{ Math.round(totalMinutes / 60) }} часов</dd></div>
        <div><dt>Статус</dt><dd>{{ course.status }}</dd></div>
      </dl>
    </article>
  </section>
</template>
