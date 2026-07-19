<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookOpen, Boxes, FileText, Plus, Sparkles } from 'lucide-vue-next'
import DefaultLayout from '@/layouts/default.vue'
import CourseCard from '@/components/CourseCard.vue'
import { useCourseStore } from '@/stores/courses'

const store=useCourseStore()
const published=computed(()=>store.courses.filter(course=>course.status==='Опубликован').length)
const modules=computed(()=>store.courses.reduce((sum,course)=>sum+course.modules.length,0))
</script>

<template>
  <DefaultLayout>
    <div class="product-dashboard">
      <section class="dashboard-welcome">
        <div><span class="eyebrow">Course workspace</span><h1>Добрый день!</h1><p>Продолжайте создавать сильные учебные продукты.</p></div>
        <RouterLink to="/app/courses" class="product-button"><Plus/>Создать курс</RouterLink>
      </section>
      <section class="dashboard-metrics">
        <article><span><BookOpen/></span><div><strong>{{store.courses.length}}</strong><small>Всего курсов</small></div></article>
        <article><span><Sparkles/></span><div><strong>{{published}}</strong><small>Опубликовано</small></div></article>
        <article><span><Boxes/></span><div><strong>{{modules}}</strong><small>Модулей</small></div></article>
        <article><span><FileText/></span><div><strong>{{store.totalLessons}}</strong><small>Уроков в программах</small></div></article>
      </section>
      <div class="dashboard-section-head"><div><span class="eyebrow">Recent work</span><h2>Последние курсы</h2></div><RouterLink to="/app/courses">Все курсы <ArrowRight/></RouterLink></div>
      <section v-if="store.courses.length" class="course-grid"><CourseCard v-for="course in store.courses.slice(0,3)" :key="course.id" :course="course"/></section>
      <section v-else class="product-empty"><BookOpen/><h3>Создайте первый курс</h3><p>Курсы появятся здесь после создания.</p><RouterLink to="/app/courses" class="product-button"><Plus/>Создать курс</RouterLink></section>
    </div>
  </DefaultLayout>
</template>
