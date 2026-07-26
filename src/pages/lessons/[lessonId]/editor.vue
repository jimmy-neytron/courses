<script setup lang="ts">
import { ref } from 'vue'
import { LayoutTemplate, ShieldAlert } from 'lucide-vue-next'
import FullscreenLayout from '@/layouts/fullscreen.vue'
import LessonBlockInspector from '@/components/lesson/editor/LessonBlockInspector.vue'
import LessonBlockOrderDialog from '@/components/lesson/editor/LessonBlockOrderDialog.vue'
import LessonBlockPickerDialog from '@/components/lesson/editor/LessonBlockPickerDialog.vue'
import LessonEditorCanvas from '@/components/lesson/editor/LessonEditorCanvas.vue'
import LessonEditorTopbar from '@/components/lesson/editor/LessonEditorTopbar.vue'
import LessonPreviewDrawer from '@/components/lesson/editor/LessonPreviewDrawer.vue'
import LessonSectionsDialog from '@/components/lesson/editor/LessonSectionsDialog.vue'
import { useLessonEditor } from '@/composables/useLessonEditor'

const previewOpen = ref(false)
const {
  found,
  blocks,
  activeSectionId,
  selectedId,
  selected,
  addQuery,
  insertAfterIndex,
  sectionDraft,
  orderSaving,
  uploading,
  sectionSaving,
  sectionsDialogOpen,
  blockOrderDialogOpen,
  blockPickerOpen,
  editorError,
  saved,
  isBusy,
  pickerPalette,
  availableSections,
  selectedSectionId,
  activeOrderSection,
  orderBlocks,
  correctAnswerOptions,
  openBlockPicker,
  chooseBlock,
  scheduleSave,
  persistOrder,
  saveBlockOrder,
  removeBlock,
  removeSelectedBlock,
  assignBlockSection,
  assignSelectedSection,
  updateOptions,
  toggleLessonStatus,
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
        @order="blockOrderDialogOpen = true"
        @preview="previewOpen = true"
        @toggle-status="toggleLessonStatus"
      />
      <LessonEditorCanvas
        v-model:blocks="blocks"
        v-model:selected-id="selectedId"
        v-model:active-section-id="activeSectionId"
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

      <LessonPreviewDrawer v-model:visible="previewOpen" :lesson="found.lesson" />
      <LessonBlockOrderDialog
        v-if="blockOrderDialogOpen && activeOrderSection"
        :blocks="orderBlocks"
        :section="activeOrderSection"
        :saving="orderSaving"
        @close="blockOrderDialogOpen = false"
        @select="selectedId = $event"
        @save="saveBlockOrder"
      />
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