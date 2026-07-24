<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, CheckCircle2, Lightbulb, RotateCcw, X } from 'lucide-vue-next'
import { UiButton } from '@neytron/compact-ui/button'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  options: string[]
  correctIndexes?: number[]
  explanation?: string
  multiple?: boolean
}>(), {
  description: '',
  correctIndexes: () => [],
  explanation: '',
  multiple: false,
})

const emit = defineEmits<{
  completed: []
}>()

const selectedIndexes = ref<number[]>([])
const checked = ref(false)

const hasKnownAnswer = computed(() => props.correctIndexes.length > 0)
const isCorrect = computed(() => {
  if (!hasKnownAnswer.value) return selectedIndexes.value.length > 0
  const selected = [...selectedIndexes.value].sort((left, right) => left - right)
  const correct = [...props.correctIndexes].sort((left, right) => left - right)
  return selected.length === correct.length && selected.every((value, index) => value === correct[index])
})

watch(
  () => props.options,
  () => reset(),
  { deep: true },
)

function selectOption(index: number): void {
  if (checked.value) return

  if (!props.multiple) {
    selectedIndexes.value = [index]
    checked.value = true
    emit('completed')
    return
  }

  selectedIndexes.value = selectedIndexes.value.includes(index)
    ? selectedIndexes.value.filter((item) => item !== index)
    : [...selectedIndexes.value, index]
}

function checkAnswer(): void {
  if (!selectedIndexes.value.length) return
  checked.value = true
  emit('completed')
}

function reset(): void {
  selectedIndexes.value = []
  checked.value = false
}

function optionState(index: number): string {
  if (!checked.value) return selectedIndexes.value.includes(index) ? 'selected' : ''
  if (props.correctIndexes.includes(index)) return 'correct'
  if (selectedIndexes.value.includes(index)) return 'wrong'
  return ''
}
</script>

<template>
  <section class="engine-test-question">
    <small>{{ props.multiple ? 'Выберите несколько вариантов' : 'Выберите один вариант' }}</small>
    <h3>{{ props.title || 'Вопрос' }}</h3>
    <p v-if="props.description" class="engine-test-question__description">{{ props.description }}</p>

    <div v-if="props.options.length" class="engine-test-options">
      <UiButton
        v-for="(option, index) in props.options"
        :key="`${option}-${index}`"
        class="engine-test-option"
        :class="optionState(index)"
        variant="ghost"
        :disabled="checked"
        @click="selectOption(index)"
      >
        <span>{{ option }}</span>
        <CheckCircle2 v-if="optionState(index) === 'correct'" :size="17" />
        <X v-else-if="optionState(index) === 'wrong'" :size="17" />
        <Check v-else-if="optionState(index) === 'selected'" :size="17" />
      </UiButton>
    </div>
    <p v-else class="engine-test-empty">Варианты ответа пока не заполнены.</p>

    <div v-if="props.multiple && props.options.length" class="engine-test-actions">
      <UiButton variant="secondary" size="sm" :disabled="!selectedIndexes.length" @click="reset">
        <template #leading><RotateCcw :size="14" /></template>
        Сбросить
      </UiButton>
      <UiButton size="sm" :disabled="!selectedIndexes.length || checked" @click="checkAnswer">
        Проверить
      </UiButton>
    </div>

    <div v-if="checked" class="engine-test-explanation" :class="{ success: isCorrect }">
      <Lightbulb :size="18" />
      <div>
        <b>{{ isCorrect ? 'Верно' : 'Посмотрите объяснение' }}</b>
        <p>{{ props.explanation || (isCorrect ? 'Ответ принят.' : 'Попробуйте ещё раз после повторения материала.') }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped src="./lesson-choice-question.css"></style>
