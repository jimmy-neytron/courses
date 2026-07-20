<script setup lang="ts">
import { FileText, Link, Music2, Settings2, Trash2 } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiInput from '@/components/ui/UiInput.vue'
import UiSelect from '@/components/ui/UiSelect.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
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
      <div><strong>Настройки блока</strong><small>{{ selected ? lessonBlockLabels[selected.type] : 'Блок не выбран' }}</small></div>
    </div>

    <template v-if="selected">
      <section class="inspector-main-fields">
        <label>Раздел урока
          <UiSelect
            :model-value="selectedSectionId"
            :options="sections"
            option-label="label"
            option-value="id"
            fluid
            @update:model-value="emit('section', $event)"
          />
          <small class="inspector-help">Блок сохранит свой формат, изменится только вкладка в уроке.</small>
        </label>
        <label>Название блока<UiInput v-model="selected.title" fluid @update:model-value="emit('change')" /></label>
        <label v-if="selected.type !== 'audio'">Описание
          <UiTextarea v-model="selected.content" rows="5" auto-resize fluid @update:model-value="emit('change')" />
        </label>
      </section>

      <template v-if="selected.type === 'audio'">
        <div class="audio-upload-zone">
          <Music2 />
          <strong>{{ selected.audioUrl ? 'Аудио подключено' : 'Добавьте запись' }}</strong>
          <small>MP3, M4A, OGG или WAV · до 50 МБ</small>
          <label :class="['ui-file-button', { 'is-disabled': uploading }]"><span>{{ uploading ? 'Загрузка…' : 'Выбрать аудио' }}</span><input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" :disabled="uploading" @change="onAudioUpload" /></label>
        </div>
        <label><Link /> Внешняя ссылка<UiInput v-model="selected.audioUrl" placeholder="https://…/recording.mp3" fluid @change="emit('change')" /></label>
        <label>Транскрипт<UiTextarea v-model="selected.transcript" rows="8" auto-resize fluid placeholder="English transcript…" @update:model-value="emit('change')" /></label>
      </template>

      <template v-if="selected.type === 'pdf'">
        <div class="audio-upload-zone">
          <FileText />
          <strong>{{ selected.fileUrl ? 'PDF подключён' : 'Добавьте PDF с теорией' }}</strong>
          <small>PDF · до 100 МБ</small>
          <label :class="['ui-file-button', { 'is-disabled': uploading }]"><span>{{ uploading ? 'Загрузка…' : 'Выбрать PDF' }}</span><input type="file" accept="application/pdf,.pdf" :disabled="uploading" @change="onPdfUpload" /></label>
        </div>
        <LessonPdfViewer v-if="selected.fileUrl" :url="selected.fileUrl" :title="selected.title" :file-name="selected.fileName" :file-size="selected.fileSize" />
      </template>

      <ConversationBlockFields v-if="selected.type === 'conversation'" :block="selected" @change="emit('change')" />
      <FlashcardsBlockFields v-if="selected.type === 'flashcards'" :block="selected" @change="emit('change')" />
      <ErrorCorrectionBlockFields v-if="selected.type === 'error_correction'" :block="selected" @change="emit('change')" />
      <TranslationBlockFields v-if="selected.type === 'translation'" :block="selected" @change="emit('change')" />

      <section v-if="selected.type === 'single_choice'" class="block-fieldset">
        <header><strong>Ответы и объяснение</strong><small>Каждый вариант вводится с новой строки</small></header>
        <label>Варианты ответов<UiTextarea :model-value="selected.options?.join('\n')" rows="6" fluid @update:model-value="emit('options', $event)" /></label>
        <label>Правильный ответ<UiSelect v-model="selected.correctOption" :options="correctAnswerOptions" option-label="label" option-value="value" fluid @update:model-value="emit('change')" /></label>
        <label>Объяснение<UiTextarea v-model="selected.explanation" rows="4" auto-resize fluid @update:model-value="emit('change')" /></label>
      </section>

      <div class="inspector-row">
        <div><strong>Обязательный блок</strong><small>Нужен для завершения урока</small></div>
        <UiSwitch v-model="selected.required" @update:model-value="emit('change')" />
      </div>
      <UiButton severity="danger" outlined fluid @click="emit('remove')"><Trash2 />Удалить блок</UiButton>
    </template>

    <div v-else class="inspector-empty">
      <Settings2 />
      <p>Выберите блок в центре, чтобы изменить его содержимое и раздел.</p>
    </div>
  </aside>
</template>
