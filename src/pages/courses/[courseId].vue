<script setup lang="ts">
import { ArrowLeft, BookOpen } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import InputText from 'primevue/inputtext'
import DefaultLayout from '@/layouts/default.vue'
import AppModal from '@/components/AppModal.vue'
import FormField from '@/components/common/FormField.vue'
import CourseCurriculum from '@/components/course/CourseCurriculum.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import CourseHero from '@/components/course/CourseHero.vue'
import CourseOverview from '@/components/course/CourseOverview.vue'
import CourseSettingsForm from '@/components/course/CourseSettingsForm.vue'
import CourseTabs from '@/components/course/CourseTabs.vue'
import { useCourseDetails } from '@/composables/useCourseDetails'

const {
  course,
  modules,
  totalLessons,
  totalMinutes,
  tab,
  moduleDialogOpen,
  lessonDialogOpen,
  deleteDialogOpen,
  moduleTitle,
  lessonTitle,
  orderSaving,
  deleting,
  saved,
  actionError,
  deleteError,
  persistOrder,
  createModule,
  openLessonDialog,
  createLesson,
  saveSettings,
  publishCourse,
  deleteCourse,
} = useCourseDetails()
</script>

<template>
  <DefaultLayout>
    <template v-if="course">
      <div class="product-course">
        <div class="product-breadcrumb"><RouterLink to="/app/courses"><ArrowLeft />Курсы</RouterLink><span>/</span><span>{{ course.title }}</span></div>
        <CourseHero :course="course" :module-count="modules.length" :lesson-count="totalLessons" :total-minutes="totalMinutes" @publish="publishCourse" @delete="deleteDialogOpen = true" />
        <div v-if="actionError" class="product-alert is-error">{{ actionError }}</div>
        <CourseTabs v-model="tab" />
        <CourseCurriculum v-if="tab === 'curriculum'" v-model="modules" :saving="orderSaving" :saved="saved" @reorder="persistOrder" @add-module="moduleDialogOpen = true" @add-lesson="openLessonDialog" />
        <CourseOverview v-else-if="tab === 'overview'" :course="course" :module-count="modules.length" :lesson-count="totalLessons" :total-minutes="totalMinutes" />
        <CourseSettingsForm v-else :course="course" :saved="saved" @save="saveSettings" />
      </div>

      <AppModal v-if="moduleDialogOpen" title="Новый модуль" @close="moduleDialogOpen = false">
        <form class="form" @submit.prevent="createModule">
          <FormField label="Название модуля"><InputText v-model="moduleTitle" autofocus placeholder="Например, Week 9 · Fluency" fluid /></FormField>
          <div class="form-actions"><PrimeButton type="button" severity="secondary" outlined @click="moduleDialogOpen = false">Отмена</PrimeButton><PrimeButton type="submit">Добавить модуль</PrimeButton></div>
        </form>
      </AppModal>

      <AppModal v-if="lessonDialogOpen" title="Новый урок" @close="lessonDialogOpen = false">
        <form class="form" @submit.prevent="createLesson">
          <FormField label="Название урока"><InputText v-model="lessonTitle" autofocus placeholder="Например, Negotiation skills" fluid /></FormField>
          <div class="form-actions"><PrimeButton type="button" severity="secondary" outlined @click="lessonDialogOpen = false">Отмена</PrimeButton><PrimeButton type="submit">Создать и открыть</PrimeButton></div>
        </form>
      </AppModal>

      <CourseDeleteDialog v-if="deleteDialogOpen" :course="course" :pending="deleting" :error="deleteError" @close="deleteDialogOpen = false" @confirm="deleteCourse" />
    </template>
    <section v-else class="product-empty full"><BookOpen /><h2>Курс не найден</h2><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
  </DefaultLayout>
</template>
