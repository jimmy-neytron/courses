<script setup lang="ts">
import { FileText, Link, Music2, Settings2, Trash2 } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import type { FileUploadUploaderEvent } from 'primevue/fileupload'
import LessonPdfViewer from '@/components/lesson/LessonPdfViewer.vue'
import ConversationBlockFields from '@/components/lesson/editor/fields/ConversationBlockFields.vue'
import ErrorCorrectionBlockFields from '@/components/lesson/editor/fields/ErrorCorrectionBlockFields.vue'
import FlashcardsBlockFields from '@/components/lesson/editor/fields/FlashcardsBlockFields.vue'
import TranslationBlockFields from '@/components/lesson/editor/fields/TranslationBlockFields.vue'
import { lessonBlockLabels } from '@/components/lesson/editor/lessonBlockCatalog'
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

function firstFile(event: FileUploadUploaderEvent): File | undefined {
  return Array.isArray(event.files) ? event.files[0] : event.files
}

function onAudioUpload(event: FileUploadUploaderEvent): void {
  const file = firstFile(event)
  if (file) emit('uploadAudio', file)
}

function onPdfUpload(event: FileUploadUploaderEvent): void {
  const file = firstFile(event)
  if (file) emit('uploadPdf', file)
}
</script>

<template>
  <aside class="product-inspector">
    <div class="editor-panel-title">
      <Settings2 />
      <div><strong>Настройки блока</strong><small>{{ selected ? lessonBlockLabels[selected.type] : 'Блок не выбран' }}</small></div>
    </div>

    <template v-if="selected">
      <section class="inspector-main-fields">
        <label>Раздел урока
          <Select
            :model-value="selectedSectionId"
            :options="sections"
            option-label="label"
            option-value="id"
            fluid
            @update:model-value="emit('section', $event)"
          />
          <small class="inspector-help">Блок сохранит свой формат, изменится только вкладка в уроке.</small>
        </label>
        <label>Название блока<InputText v-model="selected.title" fluid @update:model-value="emit('change')" /></label>
        <label v-if="selected.type !== 'audio'">Описание
          <Textarea v-model="selected.content" rows="5" auto-resize fluid @update:model-value="emit('change')" />
        </label>
      </section>

      <template v-if="selected.type === 'audio'">
        <div class="audio-upload-zone">
          <Music2 />
          <strong>{{ selected.audioUrl ? 'Аудио подключено' : 'Добавьте запись' }}</strong>
          <small>MP3, M4A, OGG или WAV · до 50 МБ</small>
          <FileUpload mode="basic" choose-label="Выбрать аудио" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" :max-file-size="50000000" custom-upload auto :disabled="uploading" @uploader="onAudioUpload" />
        </div>
        <label><Link /> Внешняя ссылка<InputText v-model="selected.audioUrl" placeholder="https://…/recording.mp3" fluid @change="emit('change')" /></label>
        <label>Транскрипт<Textarea v-model="selected.transcript" rows="8" auto-resize fluid placeholder="English transcript…" @update:model-value="emit('change')" /></label>
      </template>

      <template v-if="selected.type === 'pdf'">
        <div class="audio-upload-zone">
          <FileText />
          <strong>{{ selected.fileUrl ? 'PDF подключён' : 'Добавьте PDF с теорией' }}</strong>
          <small>PDF · до 100 МБ</small>
          <FileUpload mode="basic" choose-label="Выбрать PDF" accept="application/pdf,.pdf" :max-file-size="100000000" custom-upload auto :disabled="uploading" @uploader="onPdfUpload" />
        </div>
        <LessonPdfViewer v-if="selected.fileUrl" :url="selected.fileUrl" :title="selected.title" :file-name="selected.fileName" :file-size="selected.fileSize" />
      </template>

      <ConversationBlockFields v-if="selected.type === 'conversation'" :block="selected" @change="emit('change')" />
      <FlashcardsBlockFields v-if="selected.type === 'flashcards'" :block="selected" @change="emit('change')" />
      <ErrorCorrectionBlockFields v-if="selected.type === 'error_correction'" :block="selected" @change="emit('change')" />
      <TranslationBlockFields v-if="selected.type === 'translation'" :block="selected" @change="emit('change')" />

      <section v-if="selected.type === 'single_choice'" class="block-fieldset">
        <header><strong>Ответы и объяснение</strong><small>Каждый вариант вводится с новой строки</small></header>
        <label>Варианты ответов<Textarea :model-value="selected.options?.join('\n')" rows="6" fluid @update:model-value="emit('options', $event)" /></label>
        <label>Правильный ответ<Select v-model="selected.correctOption" :options="correctAnswerOptions" option-label="label" option-value="value" fluid @update:model-value="emit('change')" /></label>
        <label>Объяснение<Textarea v-model="selected.explanation" rows="4" auto-resize fluid @update:model-value="emit('change')" /></label>
      </section>

      <div class="inspector-row">
        <div><strong>Обязательный блок</strong><small>Нужен для завершения урока</small></div>
        <ToggleSwitch v-model="selected.required" @update:model-value="emit('change')" />
      </div>
      <PrimeButton severity="danger" outlined fluid @click="emit('remove')"><Trash2 />Удалить блок</PrimeButton>
    </template>

    <div v-else class="inspector-empty">
      <Settings2 />
      <p>Выберите блок в центре, чтобы изменить его содержимое и раздел.</p>
    </div>
  </aside>
</template>
