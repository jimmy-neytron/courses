<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, Languages, Sparkles } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiTextarea from '@/components/ui/UiTextarea.vue'

const props = defineProps<{ source?: string; target?: string; questions?: string[] }>()
const emit = defineEmits<{ complete: [] }>()
const answer = ref('')
const revealed = ref(false)
const canCheck = computed(() => answer.value.trim().split(/\s+/).length >= 4)

function check() {
  revealed.value = true
  emit('complete')
}
</script>

<template>
  <section class="engine-card translation-practice">
    <header>
      <span><Languages /></span>
      <div><small>Language Engine</small><h3>Перевод смысловыми группами</h3><p>Сохраняйте смысл и естественный порядок слов.</p></div>
    </header>
    <blockquote>{{ props.source }}</blockquote>
    <UiTextarea v-model="answer" rows="7" auto-resize fluid placeholder="Ваш перевод на английский…" />
    <div class="engine-actions">
      <span>Сначала переведите без словаря</span>
      <UiButton :disabled="!canCheck" @click="check"><Sparkles />Сравнить с эталоном</UiButton>
    </div>
    <div v-if="revealed" class="engine-feedback"><CheckCircle2 /><div><b>Естественный вариант</b><p>{{ props.target }}</p></div></div>
    <div v-if="revealed && props.questions?.length" class="translation-questions">
      <b>Проверьте понимание</b><ol><li v-for="question in props.questions" :key="question">{{ question }}</li></ol>
    </div>
  </section>
</template>
