<script setup lang="ts">
import { ref } from 'vue'
import { LayoutTemplate, ShieldAlert } from 'lucide-vue-next'
import FullscreenLayout from '@/layouts/fullscreen.vue'
import LessonBlockInspector from '@/components/lesson/editor/LessonBlockInspector.vue'
import LessonBlockPalette from '@/components/lesson/editor/LessonBlockPalette.vue'
import LessonBlockPickerDialog from '@/components/lesson/editor/LessonBlockPickerDialog.vue'
import LessonEditorCanvas from '@/components/lesson/editor/LessonEditorCanvas.vue'
import LessonEditorTopbar from '@/components/lesson/editor/LessonEditorTopbar.vue'
import LessonPreviewDrawer from '@/components/lesson/editor/LessonPreviewDrawer.vue'
import LessonSectionsDialog from '@/components/lesson/editor/LessonSectionsDialog.vue'
import { useLessonEditor } from '@/composables/useLessonEditor'

const previewOpen = ref(false)
const inspectorOpen = ref(false)
const {
  found,
  blocks,
  selectedId,
  selected,
  paletteQuery,
  addQuery,
  insertAfterIndex,
  sectionDraft,
  uploading,
  sectionSaving,
  sectionsDialogOpen,
  blockPickerOpen,
  editorError,
  saved,
  isBusy,
  filteredPalette,
  pickerPalette,
  availableSections,
  selectedSectionId,
  correctAnswerOptions,
  openBlockPicker,
  addBlock,
  chooseBlock,
  scheduleSave,
  persistOrder,
  removeBlock,
  removeSelectedBlock,
  assignBlockSection,
  assignSelectedSection,
  updateOptions,
  publish,
  uploadAudio,
  uploadPdf,
  openSections,
  saveSections,
} = useLessonEditor()
</script>

<template>
  <FullscreenLayout>
    <div v-if="found?.course.accessRole === 'creator'" class="product-editor">
      <LessonEditorTopbar
        :course-id="found.course.id"
        :course-title="found.course.title"
        :lesson-title="found.lesson.title"
        :status="found.lesson.status"
        :busy="isBusy"
        :saved="saved"
        @sections="openSections"
        @preview="previewOpen = true"
        @inspect="inspectorOpen = !inspectorOpen"
        @publish="publish"
      />
      <LessonBlockPalette v-model:query="paletteQuery" :items="filteredPalette" @add="addBlock" />
      <LessonEditorCanvas
        v-model:blocks="blocks"
        v-model:selected-id="selectedId"
        :lesson="found.lesson"
        :sections="availableSections"
        :error="editorError"
        @reorder="persistOrder"
        @add-at="openBlockPicker"
        @assign="assignBlockSection"
        @remove="removeBlock"
        @change="scheduleSave"
      />
      <LessonBlockInspector
        :class="{ 'is-mobile-open': inspectorOpen }"
        :selected="selected"
        :sections="availableSections"
        :selected-section-id="selectedSectionId"
        :correct-answer-options="correctAnswerOptions"
        :uploading="uploading"
        @section="assignSelectedSection"
        @change="scheduleSave"
        @options="updateOptions"
        @upload-audio="uploadAudio"
        @upload-pdf="uploadPdf"
        @remove="removeSelectedBlock"
      />
      <button v-if="inspectorOpen" class="editor-inspector-backdrop" aria-label="Закрыть настройки блока" @click="inspectorOpen = false" />

      <LessonPreviewDrawer v-model:visible="previewOpen" :lesson="found.lesson" />
      <LessonSectionsDialog
        v-if="sectionsDialogOpen"
        v-model="sectionDraft"
        :saving="sectionSaving"
        @close="sectionsDialogOpen = false"
        @save="saveSections"
      />
      <LessonBlockPickerDialog
        v-if="blockPickerOpen"
        v-model:query="addQuery"
        :insert-after-index="insertAfterIndex"
        :items="pickerPalette"
        @close="blockPickerOpen = false"
        @select="chooseBlock"
      />
    </div>
    <section v-else-if="found" class="product-empty full course-access-denied">
      <ShieldAlert />
      <h2>Редактор доступен только автору</h2>
      <p>Вы подключены к этому курсу как ученик. Материалы можно проходить, но нельзя изменять.</p>
      <RouterLink :to="`/preview/courses/${found.course.id}`" class="product-button">Перейти к обучению</RouterLink>
    </section>
    <section v-else class="product-empty full">
      <LayoutTemplate />
      <h2>Урок не найден</h2>
      <RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink>
    </section>
  </FullscreenLayout>
</template>
