<script setup lang="ts">
import { computed } from 'vue'
import { Download, ExternalLink, FileText } from 'lucide-vue-next'
const props = defineProps<{ url?:string; title?:string; fileName?:string; fileSize?:number }>()
const size = computed(() => props.fileSize ? `${(props.fileSize / 1024 / 1024).toFixed(1)} МБ` : 'PDF')
</script>
<template>
  <section class="lesson-pdf-viewer">
    <header>
      <span><FileText /></span>
      <div><small>Материалы урока</small><strong>{{ title || fileName || 'Теория в PDF' }}</strong><p>{{ fileName || 'Документ PDF' }} · {{ size }}</p></div>
      <div v-if="url" class="lesson-pdf-actions">
        <a :href="url" target="_blank" rel="noopener"><ExternalLink />Открыть</a>
        <a :href="url" :download="fileName || 'lesson.pdf'"><Download />Скачать</a>
      </div>
    </header>
    <iframe v-if="url" :src="`${url}#toolbar=1&navpanes=0&view=FitH`" :title="title || fileName || 'PDF урока'" />
    <div v-else class="lesson-pdf-empty"><FileText /><b>PDF ещё не загружен</b><p>Автор урока может добавить документ в редакторе.</p></div>
  </section>
</template>