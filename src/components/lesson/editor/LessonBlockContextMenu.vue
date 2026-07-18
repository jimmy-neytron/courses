<script setup lang="ts">
import { Check, EyeOff, FolderInput, Plus, Trash2 } from 'lucide-vue-next'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
import type { LessonSectionConfig, LessonSectionId } from '@/types/course'

defineProps<{
  blockLabel: string
  blockNumber: number
  sections: LessonSectionConfig[]
  activeSectionId: LessonSectionId
}>()

const emit = defineEmits<{
  assign: [sectionId: LessonSectionId]
  addBelow: []
  remove: []
}>()
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child><slot /></ContextMenuTrigger>
    <ContextMenuPortal>
      <ContextMenuContent class="lesson-block-menu" :collision-padding="12">
        <ContextMenuLabel class="lesson-block-menu__heading">
          <span>Блок {{ String(blockNumber).padStart(2, '0') }}</span>
          <strong>{{ blockLabel }}</strong>
        </ContextMenuLabel>
        <ContextMenuSeparator class="lesson-block-menu__separator" />
        <ContextMenuLabel class="lesson-block-menu__label"><FolderInput />Перенести в раздел</ContextMenuLabel>
        <ContextMenuItem
          v-for="section in sections"
          :key="section.id"
          class="lesson-block-menu__item"
          @select="emit('assign', section.id)"
        >
          <span>{{ section.label }}</span>
          <small v-if="!section.visible"><EyeOff />Скрыт</small>
          <Check v-if="section.id === activeSectionId" class="lesson-block-menu__check" />
        </ContextMenuItem>
        <ContextMenuSeparator class="lesson-block-menu__separator" />
        <ContextMenuItem class="lesson-block-menu__item" @select="emit('addBelow')"><Plus />Добавить блок ниже</ContextMenuItem>
        <ContextMenuItem class="lesson-block-menu__item is-danger" @select="emit('remove')"><Trash2 />Удалить блок</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>

<style>
.lesson-block-menu{z-index:400;min-width:250px;max-height:min(520px,calc(100vh - 24px));overflow:auto;padding:7px;border:1px solid #343b4a;border-radius:12px;background:#11151c;box-shadow:0 22px 65px #000b;color:#e8ebf0;animation:lesson-menu-in .12s ease-out;outline:0}
.lesson-block-menu__heading{display:grid;gap:4px;padding:8px 9px}.lesson-block-menu__heading span{color:#7766cc;font-size:7px;text-transform:uppercase;letter-spacing:.12em}.lesson-block-menu__heading strong{font-size:10px}
.lesson-block-menu__label{display:flex;align-items:center;gap:7px;padding:7px 9px;color:#737d8d;font-size:8px;font-weight:700}.lesson-block-menu__label svg{width:13px}
.lesson-block-menu__separator{height:1px;margin:5px;background:#252b36}
.lesson-block-menu__item{min-height:34px;display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:8px;color:#b9c0cc;font-size:9px;outline:0;cursor:pointer;user-select:none}.lesson-block-menu__item[data-highlighted]{background:#8b6cff18;color:#f4f1ff}.lesson-block-menu__item>svg{width:14px;color:#8f7ae9}.lesson-block-menu__item>span{flex:1}.lesson-block-menu__item small{display:flex;align-items:center;gap:4px;color:#687282;font-size:7px}.lesson-block-menu__item small svg{width:11px}.lesson-block-menu__item .lesson-block-menu__check{margin-left:auto;color:#8f7aff}.lesson-block-menu__item.is-danger{color:#df8582}.lesson-block-menu__item.is-danger>svg{color:#df716e}
@keyframes lesson-menu-in{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
</style>