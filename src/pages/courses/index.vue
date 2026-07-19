<script setup lang="ts">
import { LogIn, Plus, Search } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import SelectButton from 'primevue/selectbutton'
import DefaultLayout from '@/layouts/default.vue'
import PageHeading from '@/components/common/PageHeading.vue'
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
</script>

<template>
  <DefaultLayout>
    <PageHeading title="Курсы" description="Управляйте своими программами и продолжайте обучение на курсах других авторов.">
      <template #actions>
        <PrimeButton severity="secondary" outlined @click="joinDialogOpen = true"><LogIn />Ввести код курса</PrimeButton>
        <PrimeButton @click="createDialogOpen = true"><Plus />Создать курс</PrimeButton>
      </template>
    </PageHeading>

    <div class="toolbar course-filter-toolbar">
      <label><Search /><InputText v-model="query" placeholder="Найти курс" /></label>
      <SelectButton v-model="access" :options="accessOptions" :allow-empty="false" />
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
    <CourseJoinDialog v-if="joinDialogOpen" :pending="joining" :error="joinError" @close="joinDialogOpen = false" @join="joinCourse" />
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
