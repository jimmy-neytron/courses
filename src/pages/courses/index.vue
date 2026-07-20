<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, LogIn, Plus, Search } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'
import DefaultLayout from '@/layouts/default.vue'
import CourseCard from '@/components/CourseCard.vue'
import CourseCreateDialog from '@/components/course/CourseCreateDialog.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import CourseJoinDialog from '@/components/course/CourseJoinDialog.vue'
import { useCoursesPage } from '@/composables/useCoursesPage'

const {
  query,
  status,
  access,
  statusOptions,
  accessOptions,
  createDialogOpen,
  joinDialogOpen,
  joining,
  joinError,
  selectedForDelete,
  deleting,
  deleteError,
  filteredCourses,
  createCourse,
  joinCourse,
  openDeleteDialog,
  confirmDelete,
} = useCoursesPage()

const route = useRoute()
const router = useRouter()
watch(() => route.query.create, (value) => {
  if (value === '1') createDialogOpen.value = true
}, { immediate: true })

function closeCreateDialog(): void {
  createDialogOpen.value = false
  if (route.query.create) void router.replace({ query: { ...route.query, create: undefined } })
}
</script>

<template>
  <DefaultLayout>
    <div class="workspace-page courses-page">
      <section class="catalog-intro is-compact">
        <div><h1>Курсы</h1><span>{{ filteredCourses.length }} в текущем списке</span></div>
        <div class="workspace-actions">
          <UiButton severity="secondary" outlined @click="joinDialogOpen = true"><LogIn />Ввести код</UiButton>
          <UiButton @click="createDialogOpen = true"><Plus />Новый курс</UiButton>
        </div>
      </section>

      <section class="catalog-controls is-compact">
        <label class="catalog-search"><Search /><UiInput v-model="query" placeholder="Найти курс" aria-label="Поиск курсов" /></label>
        <UiSegmented v-model="access" :options="accessOptions" :allow-empty="false" aria-label="Доступ к курсам" />
        <UiSegmented v-model="status" :options="statusOptions" :allow-empty="false" aria-label="Статус курса" />
      </section>

      <section v-if="filteredCourses.length" class="course-grid workspace-course-grid catalog-grid">
        <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" deletable @delete="openDeleteDialog" />
      </section>
      <section v-else class="workspace-empty catalog-empty">
        <span><BookOpen /></span>
        <h2>{{ query ? 'Курсы не найдены' : 'Курсов пока нет' }}</h2>
        <p>{{ query ? 'Измените запрос или фильтры.' : 'Создайте первый курс с любой тематикой.' }}</p>
        <UiButton v-if="!query" @click="createDialogOpen = true"><Plus />Создать курс</UiButton>
      </section>

      <CourseCreateDialog v-if="createDialogOpen" @close="closeCreateDialog" @create="createCourse" />
      <CourseJoinDialog v-if="joinDialogOpen" :pending="joining" :error="joinError" @close="joinDialogOpen = false" @join="joinCourse" />
      <CourseDeleteDialog
        v-if="selectedForDelete"
        :course="selectedForDelete"
        :pending="deleting"
        :error="deleteError"
        @close="selectedForDelete = null"
        @confirm="confirmDelete"
      />
    </div>
  </DefaultLayout>
</template>