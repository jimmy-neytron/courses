<script setup lang="ts">
import { FileText, Link, Music2, Settings2, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import RichTextEditor from '@/components/common/RichTextEditor.vue'
import LessonPdfViewer from '@/components/lesson/player/LessonPdfViewer.vue'
import ConversationBlockFields from '@/components/lesson/editor/fields/ConversationBlockFields.vue'
import ErrorCorrectionBlockFields from '@/components/lesson/editor/fields/ErrorCorrectionBlockFields.vue'
import FlashcardsBlockFields from '@/components/lesson/editor/fields/FlashcardsBlockFields.vue'
import TranslationBlockFields from '@/components/lesson/editor/fields/TranslationBlockFields.vue'
import { lessonBlockLabels } from '@/data/lesson-block-catalog'
import type { LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

defineProps<{
  selected?: LessonBlock
  sections: LessonSectionConfig[]
  selectedSectionId: LessonSectionId
  correctAnswerOptions: Array<{ label: string; value: number }>
  uploading?: boolean
}>()

const emit = defineEmits<{
  section: [value: LessonSectionId]
  change: []
  options: [value?: string]
  uploadAudio: [file: File]
  uploadPdf: [file: File]
  remove: []
}>()

const text = {
  settings: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0431\u043b\u043e\u043a\u0430',
  noBlock: '\u0411\u043b\u043e\u043a \u043d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d',
  section: '\u0420\u0430\u0437\u0434\u0435\u043b \u0443\u0440\u043e\u043a\u0430',
  sectionHelp: '\u0411\u043b\u043e\u043a \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442 \u0441\u0432\u043e\u0439 \u0444\u043e\u0440\u043c\u0430\u0442, \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u043a\u043b\u0430\u0434\u043a\u0430 \u0432 \u0443\u0440\u043e\u043a\u0435.',
  title: '\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0431\u043b\u043e\u043a\u0430',
  description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435',
  contentPlaceholder: '\u041d\u0430\u043f\u0438\u0448\u0438\u0442\u0435 \u0442\u0435\u043a\u0441\u0442, \u0434\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0441\u043f\u0438\u0441\u043a\u0438 \u0438 \u0432\u044b\u0434\u0435\u043b\u0435\u043d\u0438\u044f...',
  audioConnected: '\u0410\u0443\u0434\u0438\u043e \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u043e',
  addRecording: '\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 \u0437\u0430\u043f\u0438\u0441\u044c',
  audioHelp: 'MP3, M4A, OGG \u0438\u043b\u0438 WAV · \u0434\u043e 50 \u041c\u0411',
  uploading: '\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430…',
  chooseAudio: '\u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0430\u0443\u0434\u0438\u043e',
  externalLink: '\u0412\u043d\u0435\u0448\u043d\u044f\u044f \u0441\u0441\u044b\u043b\u043a\u0430',
  transcript: '\u0422\u0440\u0430\u043d\u0441\u043a\u0440\u0438\u043f\u0442',
  pdfConnected: 'PDF \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0451\u043d',
  addPdf: '\u0414\u043e\u0431\u0430\u0432\u044c\u0442\u0435 PDF \u0441 \u0442\u0435\u043e\u0440\u0438\u0435\u0439',
  pdfHelp: 'PDF · \u0434\u043e 100 \u041c\u0411',
  choosePdf: '\u0412\u044b\u0431\u0440\u0430\u0442\u044c PDF',
  answers: '\u041e\u0442\u0432\u0435\u0442\u044b \u0438 \u043e\u0431\u044a\u044f\u0441\u043d\u0435\u043d\u0438\u0435',
  answersHelp: '\u041a\u0430\u0436\u0434\u044b\u0439 \u0432\u0430\u0440\u0438\u0430\u043d\u0442 \u0432\u0432\u043e\u0434\u0438\u0442\u0441\u044f \u0441 \u043d\u043e\u0432\u043e\u0439 \u0441\u0442\u0440\u043e\u043a\u0438',
  options: '\u0412\u0430\u0440\u0438\u0430\u043d\u0442\u044b \u043e\u0442\u0432\u0435\u0442\u043e\u0432',
  correctAnswer: '\u041f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u044b\u0439 \u043e\u0442\u0432\u0435\u0442',
  explanation: '\u041e\u0431\u044a\u044f\u0441\u043d\u0435\u043d\u0438\u0435',
  required: '\u041e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u0431\u043b\u043e\u043a',
  requiredHelp: '\u041d\u0443\u0436\u0435\u043d \u0434\u043b\u044f \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0438\u044f \u0443\u0440\u043e\u043a\u0430',
  deleteBlock: '\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0431\u043b\u043e\u043a',
  empty: '\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u043b\u043e\u043a \u0432 \u0446\u0435\u043d\u0442\u0440\u0435, \u0447\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0435\u0433\u043e \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u043e\u0435 \u0438 \u0440\u0430\u0437\u0434\u0435\u043b.',
}

function selectedFile(event: Event): File | undefined {
  return (event.target as HTMLInputElement).files?.[0]
}

function onAudioUpload(event: Event): void {
  const file = selectedFile(event)
  if (file) emit('uploadAudio', file)
}

function onPdfUpload(event: Event): void {
  const file = selectedFile(event)
  if (file) emit('uploadPdf', file)
}
</script>

<template>
  <aside class="product-inspector">
    <div class="editor-panel-title">
      <Settings2 />
      <div><strong>{{ text.settings }}</strong><small>{{ selected ? lessonBlockLabels[selected.type] : text.noBlock }}</small></div>
    </div>

    <template v-if="selected">
      <section class="inspector-main-fields">
        <label>{{ text.section }}
          <UiSelect
            :model-value="selectedSectionId"
            :options="sections"
            option-label="label"
            option-value="id"
            fluid
            @update:model-value="emit('section', $event)"
          />
          <small class="inspector-help">{{ text.sectionHelp }}</small>
        </label>
        <label>{{ text.title }}<UiInput v-model="selected.title" fluid @update:model-value="emit('change')" /></label>
        <label v-if="selected.type !== 'audio'">{{ text.description }}
          <RichTextEditor v-model="selected.content" :min-rows="6" :placeholder="text.contentPlaceholder" @change="emit('change')" />
        </label>
      </section>

      <template v-if="selected.type === 'audio'">
        <div class="audio-upload-zone">
          <Music2 />
          <strong>{{ selected.audioUrl ? text.audioConnected : text.addRecording }}</strong>
          <small>{{ text.audioHelp }}</small>
          <label :class="['ui-file-button', { 'is-disabled': uploading }]"><span>{{ uploading ? text.uploading : text.chooseAudio }}</span><input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" :disabled="uploading" @change="onAudioUpload" /></label>
        </div>
        <label><Link /> {{ text.externalLink }}<UiInput v-model="selected.audioUrl" placeholder="https://…/recording.mp3" fluid @change="emit('change')" /></label>
        <label>{{ text.transcript }}<UiTextarea v-model="selected.transcript" rows="8" auto-resize fluid placeholder="English transcript…" @update:model-value="emit('change')" /></label>
      </template>

      <template v-if="selected.type === 'pdf'">
        <div class="audio-upload-zone">
          <FileText />
          <strong>{{ selected.fileUrl ? text.pdfConnected : text.addPdf }}</strong>
          <small>{{ text.pdfHelp }}</small>
          <label :class="['ui-file-button', { 'is-disabled': uploading }]"><span>{{ uploading ? text.uploading : text.choosePdf }}</span><input type="file" accept="application/pdf,.pdf" :disabled="uploading" @change="onPdfUpload" /></label>
        </div>
        <LessonPdfViewer v-if="selected.fileUrl" :url="selected.fileUrl" :title="selected.title" :file-name="selected.fileName" :file-size="selected.fileSize" />
      </template>

      <ConversationBlockFields v-if="selected.type === 'conversation'" :block="selected" @change="emit('change')" />
      <FlashcardsBlockFields v-if="selected.type === 'flashcards'" :block="selected" @change="emit('change')" />
      <ErrorCorrectionBlockFields v-if="selected.type === 'error_correction'" :block="selected" @change="emit('change')" />
      <TranslationBlockFields v-if="selected.type === 'translation'" :block="selected" @change="emit('change')" />

      <section v-if="selected.type === 'single_choice'" class="block-fieldset">
        <header><strong>{{ text.answers }}</strong><small>{{ text.answersHelp }}</small></header>
        <label>{{ text.options }}<UiTextarea :model-value="selected.options?.join('\n')" rows="6" fluid @update:model-value="emit('options', $event)" /></label>
        <label>{{ text.correctAnswer }}<UiSelect v-model="selected.correctOption" :options="correctAnswerOptions" option-label="label" option-value="value" fluid @update:model-value="emit('change')" /></label>
        <label>{{ text.explanation }}<UiTextarea v-model="selected.explanation" rows="4" auto-resize fluid @update:model-value="emit('change')" /></label>
      </section>

      <div class="inspector-row">
        <div><strong>{{ text.required }}</strong><small>{{ text.requiredHelp }}</small></div>
        <UiSwitch v-model="selected.required" @update:model-value="emit('change')" />
      </div>
      <UiButton severity="danger" outlined fluid @click="emit('remove')"><Trash2 />{{ text.deleteBlock }}</UiButton>
    </template>

    <div v-else class="inspector-empty">
      <Settings2 />
      <p>{{ text.empty }}</p>
    </div>
  </aside>
</template>
