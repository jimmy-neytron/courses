<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'
import { UiInput } from '@neytron/compact-ui/input'

import { useCoursesStore } from '@/stores/courses'
import type { CourseDraft } from '@/types/course'
import { CourseCard } from '@/components/course'
import CourseFormDialog from '@/components/course/forms/course-form/CourseFormDialog.vue'
import { getErrorMessage } from '@/utils/error'
import { useNotificationsStore } from '@/stores/notifications'
import { EyebrowText, LoadingSkeleton, PageContainer, PageState } from '@/components/ui'

const courses = useCoursesStore()
const notifications = useNotificationsStore()
const query = ref('')
const dialogOpen = ref(false)
const creating = ref(false)

const filteredCourses = computed(() => {
  const normalized = query.value.trim().toLowerCase()
  if (!normalized) return courses.courses
  return courses.courses.filter((course) => `${course.title} ${course.description}`.toLowerCase().includes(normalized))
})

onMounted(() => loadCourses())

async function loadCourses(force = false): Promise<void> {
  try {
    await courses.load(force)
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось загрузить курсы'), 'danger')
  }
}

async function createCourse(draft: CourseDraft): Promise<void> {
  creating.value = true
  try {
    await courses.createCourse(draft)
    dialogOpen.value = false
    notifications.push('Курс создан', 'success')
  } catch (error) {
    notifications.push(getErrorMessage(error, 'Не удалось создать курс'), 'danger')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <LoadingSkeleton v-if="!courses.loaded || courses.loading" variant="courses" />
  <PageContainer v-else>
    <header class="courses-page__header">
      <div class="courses-page__intro">
        <EyebrowText>Рабочее пространство</EyebrowText>
        <h1>Курсы</h1>
        <p>Создавайте программу, уроки и материалы в едином аккуратном пространстве.</p>
      </div>
      <UiButton @click="dialogOpen = true">
        <template #leading><Plus :size="18" /></template>
        Создать курс
      </UiButton>
    </header>

    <PageState v-if="courses.error" title="Не удалось загрузить курсы" :description="courses.error" action-label="Повторить" retry size="compact" @action="loadCourses(true)" />
    <template v-else>
      <div class="courses-toolbar">
        <UiInput v-model="query" class="courses-search" placeholder="Найти курс" clearable>
          <template #prefix><Search :size="17" /></template>
        </UiInput>
        <span class="courses-toolbar__count">{{ filteredCourses.length }} из {{ courses.courses.length }}</span>
      </div>
      <div v-if="filteredCourses.length" class="course-grid">
        <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" />
      </div>
      <PageState v-else :title="query ? 'Ничего не найдено' : 'Создайте первый курс'" :description="query ? 'Попробуйте изменить запрос.' : 'Сначала создайте курс, затем добавьте модули и уроки.'">
        <UiButton v-if="!query" @click="dialogOpen = true">
          <template #leading><Plus :size="18" /></template>
          Создать курс
        </UiButton>
      </PageState>
    </template>

    <CourseFormDialog :open="dialogOpen" :loading="creating" @close="dialogOpen = false" @submit="createCourse" />
  </PageContainer>
</template>

<style scoped src="./courses-page.css"></style>
