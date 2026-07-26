<script setup lang="ts">
import { computed, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import UiInput from '@/components/ui/UiInput.vue'
import LessonEditorBlockCard from '@/components/lesson/editor/LessonEditorBlockCard.vue'
import { resolveLessonBlockSection } from '@/composables/useCourseSections'
import type { Lesson, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

const props = defineProps<{ lesson: Lesson; sections: LessonSectionConfig[]; error?: string }>()
const blocks = defineModel<LessonBlock[]>('blocks', { required: true })
const selectedId = defineModel<string>('selectedId', { required: true })
const emit = defineEmits<{ reorder: []; addAt: [index?: number, sectionId?: LessonSectionId]; assign: [block: LessonBlock, sectionId: LessonSectionId]; remove: [block: LessonBlock]; change: [] }>()
const courseKind = computed(() => props.sections.some((section) => section.id === 'content') ? 'general' : 'language')
const orderedSections = computed(() => [...props.sections].sort((left, right) => left.order - right.order))
const selectedIndex = computed(() => blocks.value.findIndex((item) => item.id === selectedId.value))
const activeSectionId = defineModel<LessonSectionId>('activeSectionId', { default: '' })
const selectedSectionId = computed(() => {
  const block = blocks.value.find((item) => item.id === selectedId.value)
  return block ? resolveLessonBlockSection(block, props.sections, courseKind.value) : ''
})
const activeSection = computed(() => orderedSections.value.find((section) => section.id === activeSectionId.value) ?? orderedSections.value[0])

watch([orderedSections, selectedSectionId], ([sections, selectedSection]) => {
  if (selectedSection && sections.some((section) => section.id === selectedSection)) activeSectionId.value = selectedSection
  else if (!sections.some((section) => section.id === activeSectionId.value)) activeSectionId.value = sections[0]?.id ?? ''
}, { immediate: true })

function sectionBlocks(sectionId: LessonSectionId): LessonBlock[] { return blocks.value.filter((block) => resolveLessonBlockSection(block, props.sections, courseKind.value) === sectionId) }
function globalIndex(block: LessonBlock): number { return blocks.value.findIndex((item) => item.id === block.id) }
function lastSectionIndex(sectionId: LessonSectionId): number { return blocks.value.reduce((last, block, index) => resolveLessonBlockSection(block, props.sections, courseKind.value) === sectionId ? index : last, -1) }
</script>

<template>
  <main class="product-canvas">
    <div v-if="error" class="product-alert is-error">{{ error }}</div>
    <div class="editor-document-head">
      <div><span>Урок · {{ lesson.duration }} минут · {{ blocks.filter((block) => block.type === 'single_choice').length }} вопросов</span><UiInput v-model="lesson.title" aria-label="Название урока" :spellcheck="false" @update:model-value="emit('change')" /><p>Выберите раздел, чтобы работать только с его блоками. Раздел блока можно изменить через контекстное меню.</p></div>
      <button class="editor-document-add" @click="emit('addAt', selectedIndex, activeSection?.id)"><Plus />Добавить блок</button>
    </div>

    <nav v-if="orderedSections.length" class="editor-section-tabs" aria-label="Разделы урока">
      <button v-for="section in orderedSections" :key="section.id" :class="{ 'is-active': activeSection?.id === section.id }" :aria-pressed="activeSection?.id === section.id" @click="activeSectionId = section.id">
        <span>{{ section.label }}</span><small>{{ sectionBlocks(section.id).length }}</small><i v-if="!section.visible" title="Скрыт в уроке">Скрыт</i>
      </button>
    </nav>

    <div v-if="activeSection" class="editor-section-list">
      <section :key="activeSection.id" class="editor-section-group">
        <div class="editor-section-head"><div><span>{{ String(activeSection.order + 1).padStart(2, '0') }}</span><h2>{{ activeSection.label }}</h2></div><div><small v-if="!activeSection.visible">Скрыт в уроке</small><span>{{ sectionBlocks(activeSection.id).length }} блоков</span></div></div>
        <div class="editor-block-list">
          <LessonEditorBlockCard v-for="item in sectionBlocks(activeSection.id)" :key="item.id" :item="item" :index="globalIndex(item)" :selected="selectedId === item.id" :sections="sections" :course-kind="courseKind" @select="selectedId = item.id" @assign="emit('assign', item, $event)" @add-below="emit('addAt', globalIndex(item), activeSection.id)" @remove="emit('remove', item)" />
        </div>
        <div v-if="!sectionBlocks(activeSection.id).length" class="editor-section-empty">В этом разделе пока нет блоков</div>
        <button class="editor-section-add" @click="emit('addAt', lastSectionIndex(activeSection.id), activeSection.id)"><Plus />Добавить блок в раздел</button>
      </section>
    </div>
    <section v-if="!orderedSections.length" class="editor-empty"><Plus /><h2>Создайте первый раздел</h2><p>Откройте «Разделы», чтобы начать собирать урок.</p></section>
  </main>
</template>