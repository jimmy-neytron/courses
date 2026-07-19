<script setup lang="ts">
import { Plus, Search } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import DefaultLayout from '@/layouts/default.vue'
import PageHeading from '@/components/common/PageHeading.vue'
import CourseCard from '@/components/CourseCard.vue'
import CourseCreateDialog from '@/components/course/CourseCreateDialog.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import { useCoursesPage } from '@/composables/useCoursesPage'

const {
  query,
  status,
  statusOptions,
  createDialogOpen,
  selectedForDelete,
  deleting,
  deleteError,
  filteredCourses,
  createCourse,
  openDeleteDialog,
  confirmDelete,
} = useCoursesPage()
</script>

<template>
  <DefaultLayout>
    <PageHeading title="Курсы" description="Создавайте, публикуйте и обновляйте учебные программы.">
      <template #actions>
        <PrimeButton @click="createDialogOpen = true"><Plus />Создать курс</PrimeButton>
      </template>
    </PageHeading>

    <div class="toolbar">
      <label><Search /><InputText v-model="query" placeholder="Найти курс" /></label>
      <SelectButton v-model="status" :options="statusOptions" :allow-empty="false" />
    </div>

    <section v-if="filteredCourses.length" class="course-grid">
      <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" deletable @delete="openDeleteDialog" />
    </section>
    <section v-else class="empty-state">
      <Search />
      <h2>Курсы не найдены</h2>
      <p>Измените поисковый запрос или создайте новый курс.</p>
    </section>

    <CourseCreateDialog v-if="createDialogOpen" @close="createDialogOpen = false" @create="createCourse" />
    <CourseDeleteDialog
      v-if="selectedForDelete"
      :course="selectedForDelete"
      :pending="deleting"
      :error="deleteError"
      @close="selectedForDelete = null"
      @confirm="confirmDelete"
    />
  </DefaultLayout>
</template>
