<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Headphones, Pause, Play, RotateCcw, Volume2 } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

const props = withDefaults(defineProps<{
  src?: string
  transcript?: string
  title?: string
  language?: string
  showAnswer?: boolean
}>(), {
  src: '',
  transcript: '',
  title: 'Аудирование',
  language: 'en-US',
  showAnswer: true,
})

const emit = defineEmits<{
  completed: []
}>()

const audioElement = ref<HTMLAudioElement | null>(null)
const speaking = ref(false)
const speechError = ref('')
const hasRecording = computed(() => Boolean(props.src?.trim()))
const canSpeak = computed(() => Boolean(props.transcript?.trim()) && supportsSpeechSynthesis())

watch(
  () => [props.src, props.transcript],
  () => stopSpeech(),
)

function toggleSpeech(): void {
  if (speaking.value) {
    stopSpeech()
    return
  }
  speak()
}

function speak(): void {
  if (!canSpeak.value || typeof window === 'undefined') return

  const synthesis = window.speechSynthesis
  synthesis.cancel()
  speechError.value = ''

  const utterance = new SpeechSynthesisUtterance(props.transcript.trim())
  utterance.lang = normalizeLanguage(props.language)
  utterance.rate = 0.88
  utterance.pitch = 1
  utterance.volume = 1
  utterance.voice = findVoice(utterance.lang)
  utterance.onstart = () => { speaking.value = true }
  utterance.onend = () => {
    speaking.value = false
    emit('completed')
  }
  utterance.onerror = (event) => {
    speaking.value = false
    if (event.error !== 'canceled' && event.error !== 'interrupted') {
      speechError.value = 'Не удалось запустить встроенную озвучку в этом браузере.'
    }
  }

  speaking.value = true
  synthesis.speak(utterance)
}

function stopSpeech(): void {
  if (typeof window !== 'undefined' && supportsSpeechSynthesis()) {
    window.speechSynthesis.cancel()
  }
  speaking.value = false
}

async function restart(): Promise<void> {
  if (hasRecording.value && audioElement.value) {
    stopSpeech()
    audioElement.value.currentTime = 0
    await audioElement.value.play().catch(() => undefined)
    return
  }

  stopSpeech()
  speak()
}

function completeRecording(): void {
  emit('completed')
}

function supportsSpeechSynthesis(): boolean {
  return typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && 'SpeechSynthesisUtterance' in window
}

function normalizeLanguage(language: string): string {
  const normalized = language.trim()
  if (!normalized || normalized === 'und') return 'en-US'
  if (normalized.includes('-')) return normalized

  const locales: Record<string, string> = {
    de: 'de-DE',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    it: 'it-IT',
    pt: 'pt-PT',
    ru: 'ru-RU',
  }
  return locales[normalized.toLowerCase()] ?? normalized
}

function findVoice(language: string): SpeechSynthesisVoice | null {
  if (!supportsSpeechSynthesis()) return null
  const voices = window.speechSynthesis.getVoices()
  const normalized = language.toLowerCase()
  const baseLanguage = normalized.split('-')[0]

  return voices.find((voice) => voice.lang.toLowerCase() === normalized)
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(`${baseLanguage}-`))
    ?? null
}

onBeforeUnmount(stopSpeech)
</script>

<template>
  <section class="lesson-audio-player">
    <div class="lesson-audio-heading">
      <span><Headphones :size="19" /></span>
      <div>
        <small>Listening practice</small>
        <strong>{{ props.title || 'Аудирование' }}</strong>
      </div>
    </div>

    <audio
      v-if="hasRecording"
      ref="audioElement"
      :src="props.src"
      controls
      preload="metadata"
      @ended="completeRecording"
    />

    <div v-else class="lesson-audio-tts">
      <UiButton
        :disabled="!canSpeak"
        size="sm"
        @click="toggleSpeech"
      >
        <template #leading>
          <Pause v-if="speaking" :size="15" />
          <Play v-else :size="15" />
        </template>
        {{ speaking ? 'Остановить' : 'Прослушать запись' }}
      </UiButton>
      <span><Volume2 :size="14" /> Встроенная озвучка браузера</span>
    </div>

    <p v-if="!hasRecording && !props.transcript" class="lesson-audio-empty">
      Добавьте текст в содержимое блока — он будет озвучен автоматически.
    </p>

    <p v-if="speechError" class="lesson-audio-error">{{ speechError }}</p>

    <UiButton
      class="lesson-audio-restart"
      variant="secondary"
      size="sm"
      :disabled="!hasRecording && !canSpeak"
      @click="restart"
    >
      <template #leading><RotateCcw :size="14" /></template>
      Прослушать ещё раз
    </UiButton>

    <details v-if="props.showAnswer && props.transcript">
      <summary>Показать транскрипт</summary>
      <p>{{ props.transcript }}</p>
    </details>
  </section>
</template>

<style scoped src="./lesson-audio-player.css"></style>
