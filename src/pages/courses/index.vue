<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BookOpen, Plus, Search } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSegmented from '@/components/ui/UiSegmented.vue'
import DefaultLayout from '@/layouts/default.vue'
import CourseCard from '@/components/course/CourseCard.vue'
import CourseCreateDialog from '@/components/course/CourseCreateDialog.vue'
import CourseDeleteDialog from '@/components/course/CourseDeleteDialog.vue'
import { useCoursesPage } from '@/composables/useCoursesPage'

const {
  query,
  status,
  access,
  statusOptions,
  accessOptions,
  createDialogOpen,
  selectedForDelete,
  deleting,
  deleteError,
  filteredCourses,
  createCourse,
  openDeleteDialog,
  shareCourse,
  toggleCourseStatus,
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
        <div><h1>РљСѓСЂСЃС‹</h1><span>{{ filteredCourses.length }} РІ С‚РµРєСѓС‰РµРј СЃРїРёСЃРєРµ</span></div>
        <div class="workspace-actions">
          <UiButton class="catalog-create-button" @click="createDialogOpen = true"><Plus />РќРѕРІС‹Р№ РєСѓСЂСЃ</UiButton>
        </div>
      </section>

      <section class="catalog-controls is-compact">
        <label class="catalog-search"><Search /><UiInput v-model="query" placeholder="РќР°Р№С‚Рё РєСѓСЂСЃ" aria-label="РџРѕРёСЃРє РєСѓСЂСЃРѕРІ" /></label>
        <UiSegmented v-model="access" :options="accessOptions" :allow-empty="false" aria-label="Р”РѕСЃС‚СѓРї Рє РєСѓСЂСЃР°Рј" />
        <UiSegmented v-model="status" :options="statusOptions" :allow-empty="false" aria-label="РЎС‚Р°С‚СѓСЃ РєСѓСЂСЃР°" />
      </section>

      <section v-if="filteredCourses.length" class="course-grid workspace-course-grid catalog-grid">
        <CourseCard v-for="course in filteredCourses" :key="course.id" :course="course" actionable @share="shareCourse" @toggle-status="toggleCourseStatus" @delete="openDeleteDialog" />
      </section>
      <section v-else class="workspace-empty catalog-empty">
        <span><BookOpen /></span>
        <h2>{{ query ? 'РљСѓСЂСЃС‹ РЅРµ РЅР°Р№РґРµРЅС‹' : 'РљСѓСЂСЃРѕРІ РїРѕРєР° РЅРµС‚' }}</h2>
        <p>{{ query ? 'РР·РјРµРЅРёС‚Рµ Р·Р°РїСЂРѕСЃ РёР»Рё С„РёР»СЊС‚СЂС‹.' : 'РЎРѕР·РґР°Р№С‚Рµ РїРµСЂРІС‹Р№ РєСѓСЂСЃ СЃ Р»СЋР±РѕР№ С‚РµРјР°С‚РёРєРѕР№.' }}</p>
        <UiButton v-if="!query" @click="createDialogOpen = true"><Plus />РЎРѕР·РґР°С‚СЊ РєСѓСЂСЃ</UiButton>
      </section>

      <CourseCreateDialog v-if="createDialogOpen" @close="closeCreateDialog" @create="createCourse" />
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
