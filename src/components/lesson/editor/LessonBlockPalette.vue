<script setup lang="ts">
import { computed } from 'vue'
import { LayoutTemplate, Plus, Search } from 'lucide-vue-next'
import InputText from 'primevue/inputtext'
import {
  groupLessonBlockCatalog,
  type LessonBlockCatalogItem,
} from '@/components/lesson/editor/lessonBlockCatalog'
import type { BlockType } from '@/types/course'

const props = defineProps<{ items: LessonBlockCatalogItem[] }>()
const query = defineModel<string>('query', { required: true })
defineEmits<{ add: [type: BlockType] }>()

const groups = computed(() => groupLessonBlockCatalog(props.items))
</script>

<template>
  <aside class="product-palette">
    <div class="palette-sticky-head">
      <div class="editor-panel-title">
        <LayoutTemplate />
        <div><strong>Добавить блок</strong><small>Вставится после выбранного</small></div>
      </div>
      <label class="palette-search">
        <Search />
        <InputText v-model="query" type="search" placeholder="Найти блок…" aria-label="Найти тип блока" />
      </label>
    </div>

    <section v-for="group in groups" :key="group.label" class="palette-group">
      <h3>{{ group.label }}</h3>
      <div class="palette-list">
        <button v-for="item in group.blocks" :key="item.type" @click="$emit('add', item.type)">
          <span><component :is="item.icon" /></span>
          <div><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div>
          <Plus />
        </button>
      </div>
    </section>
    <p v-if="!items.length" class="palette-empty">Ничего не найдено</p>
  </aside>
</template>
