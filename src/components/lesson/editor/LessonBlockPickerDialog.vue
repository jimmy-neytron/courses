<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import UiInput from '@/components/ui/UiInput.vue'
import AppModal from '@/components/AppModal.vue'
import {
  groupLessonBlockCatalog,
  type LessonBlockCatalogItem,
} from '@/components/lesson/editor/lessonBlockCatalog'
import type { BlockType } from '@/types/course'

const props = defineProps<{ insertAfterIndex: number; items: LessonBlockCatalogItem[] }>()
const query = defineModel<string>('query', { required: true })
const emit = defineEmits<{ close: []; select: [type: BlockType] }>()
const groups = computed(() => groupLessonBlockCatalog(props.items))

function chooseFirst(): void {
  const first = props.items[0]
  if (first) emit('select', first.type)
}
</script>

<template>
  <AppModal title="Добавить блок" @close="emit('close')">
    <div class="block-picker">
      <div class="block-picker-target">
        <Plus />
        <span><strong>Место вставки</strong><small>{{ insertAfterIndex < 0 ? 'В начало урока' : `После блока ${String(insertAfterIndex + 1).padStart(2, '0')}` }}</small></span>
      </div>
      <label class="block-picker-search">
        <Search />
        <UiInput v-model="query" type="search" placeholder="Теория, Listening, тест…" autofocus @keydown.enter.prevent="chooseFirst" />
      </label>
      <section v-for="group in groups" :key="group.label" class="block-picker-group">
        <h3>{{ group.label }}</h3>
        <div class="block-picker-grid">
          <button v-for="item in group.blocks" :key="item.type" @click="emit('select', item.type)">
            <span><component :is="item.icon" /></span>
            <div><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div>
            <Plus />
          </button>
        </div>
      </section>
      <p v-if="!items.length" class="palette-empty">Ничего не найдено</p>
    </div>
  </AppModal>
</template>
