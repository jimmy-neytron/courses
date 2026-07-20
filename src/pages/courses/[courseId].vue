<script setup lang="ts">
import { ArrowLeft, BookOpen } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import DefaultLayout from '@/layouts/default.vue'
import AppModal from '@/components/AppModal.vue'
import FormField from '@/components/common/FormField.vue'
import CourseCurriculum from '@/components/course/CourseCurriculum.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import CourseHero from '@/components/course/CourseHero.vue'
import CourseInviteDialog from '@/components/course/CourseInviteDialog.vue'
import CourseOverview from '@/components/course/CourseOverview.vue'
import CourseSettingsForm from '@/components/course/CourseSettingsForm.vue'
import CourseTabs from '@/components/course/CourseTabs.vue'
import { useCourseDetails } from '@/composables/useCourseDetails'

const {
  course,
  canManage,
  modules,
  totalLessons,
  totalMinutes,
  tab,
  moduleDialogOpen,
  lessonDialogOpen,
  deleteDialogOpen,
  inviteDialogOpen,
  inviteRefreshing,
  inviteError,
  moduleTitle,
  lessonTitle,
  orderSaving,
  duplicatingId,
  deleting,
  saved,
  actionError,
  deleteError,
  persistOrder,
  createModule,
  openLessonDialog,
  createLesson,
  duplicateLesson,
  duplicateModule,
  saveSettings,
  publishCourse,
  deleteCourse,
  refreshInviteCode,
} = useCourseDetails()
</script>

<template>
  <DefaultLayout>
    <template v-if="course">
      <div class="product-course">
        <div class="product-breadcrumb"><RouterLink to="/app/courses"><ArrowLeft />Курсы</RouterLink><span>/</span><span>{{ course.title }}</span></div>
        <CourseHero :course="course" :module-count="modules.length" :lesson-count="totalLessons" :total-minutes="totalMinutes" @publish="publishCourse" @delete="deleteDialogOpen = true" @invite="inviteDialogOpen = true" />
        <div v-if="actionError" class="product-alert is-error">{{ actionError }}</div>
        <CourseTabs v-if="canManage" v-model="tab" />
        <CourseCurriculum v-if="canManage && tab === 'curriculum'" v-model="modules" :saving="orderSaving" :saved="saved" :duplicating-id="duplicatingId" @reorder="persistOrder" @add-module="moduleDialogOpen = true" @add-lesson="openLessonDialog" @duplicate-module="duplicateModule" @duplicate-lesson="duplicateLesson" />
        <CourseOverview v-else-if="!canManage || tab === 'overview'" :course="course" :module-count="modules.length" :lesson-count="totalLessons" :total-minutes="totalMinutes" />
        <CourseSettingsForm v-else-if="canManage" :course="course" :saved="saved" @save="saveSettings" />
      </div>

      <AppModal v-if="moduleDialogOpen" title="Новый модуль" @close="moduleDialogOpen = false">
        <form class="form" @submit.prevent="createModule">
          <FormField label="Название модуля"><UiInput v-model="moduleTitle" autofocus placeholder="Например, Week 9 · Fluency" fluid /></FormField>
          <div class="form-actions"><UiButton type="button" severity="secondary" outlined @click="moduleDialogOpen = false">Отмена</UiButton><UiButton type="submit">Добавить модуль</UiButton></div>
        </form>
      </AppModal>

      <AppModal v-if="lessonDialogOpen" title="Новый урок" @close="lessonDialogOpen = false">
        <form class="form" @submit.prevent="createLesson">
          <FormField label="Название урока"><UiInput v-model="lessonTitle" autofocus placeholder="Например, Negotiation skills" fluid /></FormField>
          <div class="form-actions"><UiButton type="button" severity="secondary" outlined @click="lessonDialogOpen = false">Отмена</UiButton><UiButton type="submit">Создать и открыть</UiButton></div>
        </form>
      </AppModal>

      <CourseDeleteDialog v-if="deleteDialogOpen" :course="course" :pending="deleting" :error="deleteError" @close="deleteDialogOpen = false" @confirm="deleteCourse" />
      <CourseInviteDialog v-if="inviteDialogOpen" :course="course" :refreshing="inviteRefreshing" :error="inviteError" @close="inviteDialogOpen = false" @regenerate="refreshInviteCode" />
    </template>
    <section v-else class="product-empty full"><BookOpen /><h2>Курс не найден</h2><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
  </DefaultLayout>
</template>
