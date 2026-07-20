<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Check, EyeOff, FolderInput, Plus, Trash2 } from 'lucide-vue-next'
import type { LessonSectionConfig, LessonSectionId } from '@/types/course'

const props = defineProps<{
  blockLabel: string
  blockNumber: number
  sections: LessonSectionConfig[]
  activeSectionId: LessonSectionId
}>()
const emit = defineEmits<{ assign: [sectionId: LessonSectionId]; addBelow: []; remove: [] }>()
const open = ref(false)
const x = ref(0)
const y = ref(0)

function openMenu(event: MouseEvent): void {
  x.value = Math.min(event.clientX, window.innerWidth - 270)
  y.value = Math.min(event.clientY, window.innerHeight - 360)
  open.value = true
}
function close(): void { open.value = false }
function assign(sectionId: LessonSectionId): void { emit('assign', sectionId); close() }
function addBelow(): void { emit('addBelow'); close() }
function remove(): void { emit('remove'); close() }
function onKeydown(event: KeyboardEvent): void { if (event.key === 'Escape') close() }
onMounted(() => {
  window.addEventListener('click', close)
  window.addEventListener('scroll', close, true)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', close)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="lesson-context-trigger" @contextmenu.prevent.stop="openMenu"><slot /></div>
  <Teleport to="body">
    <div v-if="open" class="ui-context-menu lesson-block-menu" :style="{ left: `${x}px`, top: `${y}px` }" role="menu" @click.stop>
      <div class="ui-context-title">Блок {{ String(props.blockNumber).padStart(2, '0') }} · {{ props.blockLabel }}</div>
      <div class="ui-context-label"><FolderInput />Перенести в раздел</div>
      <button v-for="section in sections" :key="section.id" type="button" class="ui-context-section" @click="assign(section.id)">
        <span>{{ section.label }}</span><small v-if="!section.visible"><EyeOff />Скрыт</small><Check v-if="section.id === activeSectionId" />
      </button>
      <div class="ui-context-separator" />
      <button type="button" @click="addBelow"><Plus /><span>Добавить блок ниже</span></button>
      <button type="button" class="is-danger" @click="remove"><Trash2 /><span>Удалить блок</span></button>
    </div>
  </Teleport>
</template>

<style scoped>
.lesson-context-trigger{display:contents}
.ui-context-menu{position:fixed;z-index:1200;width:260px;padding:7px;border:1px solid #314238;border-radius:12px;background:#0d1510f5;box-shadow:0 18px 60px #0009;backdrop-filter:blur(16px)}
.ui-context-title,.ui-context-label{padding:8px 9px;color:#66756c;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}.ui-context-label{display:flex;gap:7px;align-items:center}.ui-context-label svg{width:14px}
.ui-context-menu button{width:100%;min-height:34px;display:flex;align-items:center;gap:8px;padding:0 9px;border:0;border-radius:8px;background:transparent;color:#c8d3cc;font:inherit;font-size:11px;text-align:left;cursor:pointer}.ui-context-menu button:hover{background:#ffffff0b}.ui-context-menu button>span{flex:1}.ui-context-menu button>svg{width:15px}.ui-context-menu button small{display:flex;align-items:center;gap:3px;color:#728178;font-size:9px}.ui-context-menu button small svg{width:11px}.ui-context-section{padding-left:30px!important}.ui-context-menu .is-danger{color:#ff9599}.ui-context-separator{height:1px;margin:6px;background:#25342b}
</style>