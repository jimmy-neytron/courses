<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next'
import ActivePractice from '@/components/lesson/player/practice/ActivePractice.vue'
import ConversationPractice from '@/components/lesson/player/practice/ConversationPractice.vue'
import ErrorClinic from '@/components/lesson/player/practice/ErrorClinic.vue'
import FlashcardDeck from '@/components/lesson/player/practice/FlashcardDeck.vue'
import TranslationPractice from '@/components/lesson/player/practice/TranslationPractice.vue'
import LessonAudioPlayer from '@/components/lesson/player/LessonAudioPlayer.vue'
import LessonPdfViewer from '@/components/lesson/player/LessonPdfViewer.vue'
import RichTextContent from '@/components/common/RichTextContent.vue'
import { richTextToPlainText } from '@/components/common/richText'
import type { LessonBlock } from '@/types/course'

defineProps<{ block: LessonBlock }>()
const emit = defineEmits<{ complete: [] }>()
</script>

<template>
  <LessonPdfViewer
    v-if="block.type === 'pdf'"
    :url="block.fileUrl"
    :title="block.title"
    :file-name="block.fileName"
    :file-size="block.fileSize"
  />
  <LessonAudioPlayer
    v-else-if="block.type === 'audio'"
    :src="block.audioUrl"
    :title="block.title"
    :transcript="block.transcript"
    @completed="emit('complete')"
  />
  <ConversationPractice
    v-else-if="block.type === 'conversation'"
    :role="block.role"
    :prompt="block.prompt"
    :starter="block.starter"
    :sample="block.sampleAnswer"
    @complete="emit('complete')"
  />
  <FlashcardDeck
    v-else-if="block.type === 'flashcards'"
    :cards="block.cards ?? []"
    @complete="emit('complete')"
  />
  <ErrorClinic
    v-else-if="block.type === 'error_correction'"
    :items="block.corrections ?? []"
    @complete="emit('complete')"
  />
  <TranslationPractice
    v-else-if="block.type === 'translation'"
    :source="block.sourceText"
    :target="block.targetText"
    :questions="block.comprehensionQuestions"
    @complete="emit('complete')"
  />
  <ActivePractice
    v-else-if="block.type === 'practice'"
    :title="block.title"
    :content="block.content"
    @complete="emit('complete')"
  />
  <article v-else :class="['engine-theory-block', block.type]">
    <h2 v-if="block.type === 'heading'">
      {{ richTextToPlainText(block.content ?? '') }}
    </h2>
    <section v-else-if="block.type === 'grammar'">
      <small>Теоретический материал</small>
      <h3>{{ block.title }}</h3>
      <RichTextContent :content="block.content" />
    </section>
    <aside v-else-if="block.type === 'callout'">
      <UiAlertSquare />
      <div><b>{{ block.title }}</b><RichTextContent :content="block.content" /></div>
    </aside>
    <section v-else><h3>{{ block.title }}</h3><RichTextContent :content="block.content" /></section>
  </article>
</template>

