<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  ref,
  watch,
} from 'vue'
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  RotateCcw,
  Underline,
} from 'lucide-vue-next'
import { normalizeRichText } from '@/components/common/richText'

const props = withDefaults(defineProps<{
  modelValue?: string
  placeholder?: string
  minRows?: number
}>(), {
  modelValue: '',
  placeholder: '',
  minRows: 5,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: []
}>()

const editor = ref<HTMLElement | null>(null)
const focused = ref(false)

const html = computed(() => (
  normalizeRichText(props.modelValue)
))

function writeHtml(value = html.value): void {
  if (!editor.value || focused.value) return

  if (editor.value.innerHTML !== value) {
    editor.value.innerHTML = value
  }
}

onMounted(() => {
  writeHtml()
})

watch(html, async (value) => {
  await nextTick()
  writeHtml(value)
})

function sync(): void {
  const value = normalizeRichText(
    editor.value?.innerHTML ?? '',
  )

  const currentValue = normalizeRichText(
    props.modelValue ?? '',
  )

  if (value === currentValue) return

  emit('update:modelValue', value)
  emit('change')
}

function handleBlur(): void {
  focused.value = false
  sync()
}

function command(
  name: string,
  value?: string,
): void {
  editor.value?.focus()
  document.execCommand(name, false, value)
  sync()
}

function setBlock(tag: 'p' | 'h2' | 'h3'): void {
  command('formatBlock', tag)
}

function addLink(): void {
  const url = window.prompt('URL')?.trim()

  if (!url) return

  command('createLink', url)
}

function clearFormat(): void {
  command('removeFormat')
}

function onPaste(event: ClipboardEvent): void {
  event.preventDefault()

  const htmlValue = event.clipboardData?.getData('text/html')
  const textValue = event.clipboardData?.getData('text/plain')

  document.execCommand(
    'insertHTML',
    false,
    normalizeRichText(htmlValue || textValue || ''),
  )

  sync()
}
</script>

<template>
  <div :class="['rich-editor', focused && 'is-focused']">
    <div
      class="rich-editor-toolbar"
      aria-label="Text formatting"
    >
      <button
        type="button"
        title="Bold"
        @click="command('bold')"
      >
        <Bold />
      </button>

      <button
        type="button"
        title="Italic"
        @click="command('italic')"
      >
        <Italic />
      </button>

      <button
        type="button"
        title="Underline"
        @click="command('underline')"
      >
        <Underline />
      </button>

      <span />

      <button
        type="button"
        title="Paragraph"
        @click="setBlock('p')"
      >
        <Pilcrow />
      </button>

      <button
        type="button"
        title="Heading"
        @click="setBlock('h3')"
      >
        H
      </button>

      <button
        type="button"
        title="Bulleted list"
        @click="command('insertUnorderedList')"
      >
        <List />
      </button>

      <button
        type="button"
        title="Numbered list"
        @click="command('insertOrderedList')"
      >
        <ListOrdered />
      </button>

      <button
        type="button"
        title="Link"
        @click="addLink"
      >
        <Link />
      </button>

      <span />

      <button
        type="button"
        title="Undo"
        @click="command('undo')"
      >
        <RotateCcw />
      </button>

      <button
        type="button"
        title="Redo"
        @click="command('redo')"
      >
        <Redo2 />
      </button>

      <button
        type="button"
        title="Clear formatting"
        @click="clearFormat"
      >
        Tx
      </button>
    </div>

    <div
      ref="editor"
      class="rich-editor-surface rich-text-content"
      contenteditable="true"
      :data-placeholder="placeholder"
      :style="{ minHeight: `${minRows * 24 + 28}px` }"
      @focus="focused = true"
      @blur="handleBlur"
      @input="sync"
      @paste="onPaste"
    />
  </div>
</template>
