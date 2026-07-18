<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search } from 'lucide-vue-next'
import DefaultLayout from '@/layouts/default.vue'
import AppModal from '@/components/AppModal.vue'
import CourseCard from '@/components/CourseCard.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import { useCourseStore } from '@/stores/courses'
import type { Course, CourseStatus } from '@/types/course'

const store = useCourseStore()
const router = useRouter()
const query = ref('')
const status = ref<CourseStatus | 'Все'>('Все')
const showCreate = ref(false)
const title = ref('')
const description = ref('')
const selectedForDelete = ref<Course | null>(null)
const deleting = ref(false)
const deleteError = ref('')
const filtered = computed(() => store.courses.filter((course) =>
  course.title.toLowerCase().includes(query.value.toLowerCase()) &&
  (status.value === 'Все' || course.status === status.value),
))

async function create() {
  if (!title.value.trim()) return
  const id = await store.createCourse(title.value, description.value || 'Новая учебная программа')
  showCreate.value = false
  await router.push(`/app/courses/${id}`)
}
function openDelete(course: Course) {
  selectedForDelete.value = course
  deleteError.value = ''
}
async function confirmDelete() {
  if (!selectedForDelete.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await store.deleteCourse(selectedForDelete.value.id)
    selectedForDelete.value = null
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : 'Не удалось удалить курс'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <DefaultLayout>
    <div class="page-title">
      <div><h1>Курсы</h1><p>Создавайте, публикуйте и обновляйте учебные программы.</p></div>
      <button class="primary" @click="showCreate = true"><Plus />Создать курс</button>
    </div>
    <div class="toolbar">
      <label><Search /><input v-model="query" placeholder="Найти курс" /></label>
      <button v-for="item in (['Все', 'Опубликован', 'Черновик'] as const)" :key="item" :class="['filter', status === item && 'active']" @click="status = item">{{ item }}</button>
    </div>
    <section v-if="filtered.length" class="course-grid">
      <CourseCard v-for="course in filtered" :key="course.id" :course="course" deletable @delete="openDelete" />
    </section>
    <section v-else class="empty-state"><Search /><h2>Курсы не найдены</h2><p>Измените поисковый запрос или создайте новый курс.</p></section>

    <AppModal v-if="showCreate" title="Новый курс" @close="showCreate = false">
      <form class="form" @submit.prevent="create">
        <label>Название<input v-model="title" autofocus placeholder="Например, Основы испанского" /></label>
        <label>Описание<textarea v-model="description" placeholder="Коротко расскажите о курсе"></textarea></label>
        <div class="form-actions">
          <button type="button" class="ghost" @click="showCreate = false">Отмена</button>
          <button class="primary">Создать курс</button>
        </div>
      </form>
    </AppModal>
    <CourseDeleteDialog v-if="selectedForDelete" :course="selectedForDelete" :pending="deleting" :error="deleteError" @close="selectedForDelete = null" @confirm="confirmDelete" />
  </DefaultLayout>
</template>