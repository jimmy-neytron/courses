<script setup lang="ts">
import { computed, ref } from 'vue'
import { CheckCircle2, MessageCircle, RotateCcw, Sparkles } from 'lucide-vue-next'
import PrimeButton from 'primevue/button'
import Textarea from 'primevue/textarea'

const props = defineProps<{ role?: string; prompt?: string; starter?: string; sample?: string }>()
const emit = defineEmits<{ complete: [] }>()
const answer = ref('')
const showSample = ref(false)
const words = computed(() => answer.value.trim() ? answer.value.trim().split(/\s+/).length : 0)

function reset() {
  answer.value = ''
  showSample.value = false
}
</script>

<template>
  <section class="engine-card conversation-practice">
    <header>
      <span><MessageCircle /></span>
      <div><small>Native conversation mode</small><h3>Разговор с носителем</h3><p>{{ props.role }}</p></div>
    </header>
    <div class="engine-prompt"><b>Ситуация</b><p>{{ props.prompt }}</p><small>{{ props.starter }}</small></div>
    <Textarea v-model="answer" rows="7" auto-resize fluid placeholder="Напишите свои реплики на английском…" />
    <div class="engine-actions">
      <span>{{ words }} слов · цель 40+</span>
      <PrimeButton severity="secondary" outlined @click="reset"><RotateCcw />Начать заново</PrimeButton>
      <PrimeButton :disabled="words < 12" @click="showSample = true; emit('complete')"><Sparkles />Проверить себя</PrimeButton>
    </div>
    <div v-if="showSample" class="engine-feedback">
      <CheckCircle2 /><div><b>Пример естественного ответа</b><p>{{ props.sample }}</p><small>Сравните порядок слов и выражения. Не копируйте дословно — улучшите свой ответ.</small></div>
    </div>
  </section>
</template>
