<script setup lang="ts">
import { computed, ref } from 'vue'
import ContextMenu from 'primevue/contextmenu'
import type { MenuItem } from 'primevue/menuitem'
import { Check, EyeOff, FolderInput, Plus, Trash2 } from 'lucide-vue-next'
import type { LessonSectionConfig, LessonSectionId } from '@/types/course'

const props=defineProps<{
  blockLabel:string
  blockNumber:number
  sections:LessonSectionConfig[]
  activeSectionId:LessonSectionId
}>()
const emit=defineEmits<{assign:[sectionId:LessonSectionId];addBelow:[];remove:[]}>()
const menu=ref<InstanceType<typeof ContextMenu>>()
const items=computed<MenuItem[]>(()=>[
  {label:`Блок ${String(props.blockNumber).padStart(2,'0')} · ${props.blockLabel}`,disabled:true},
  {separator:true},
  {
    label:'Перенести в раздел',
    icon:'folder',
    items:props.sections.map(section=>({
      label:section.label,
      data:{kind:'section',hidden:!section.visible,active:section.id===props.activeSectionId},
      command:()=>emit('assign',section.id),
    })),
  },
  {separator:true},
  {label:'Добавить блок ниже',data:{kind:'add'},command:()=>emit('addBelow')},
  {label:'Удалить блок',data:{kind:'remove'},class:'is-danger',command:()=>emit('remove')},
])

function openMenu(event:MouseEvent){menu.value?.show(event)}
</script>

<template>
  <div class="lesson-context-trigger" @contextmenu="openMenu"><slot/></div>
  <ContextMenu ref="menu" :model="items" class="lesson-block-menu">
    <template #item="{item,props:menuProps}">
      <a v-bind="menuProps.action" :class="{'is-danger':item.data?.kind==='remove'}">
        <FolderInput v-if="item.icon==='folder'"/>
        <Plus v-else-if="item.data?.kind==='add'"/>
        <Trash2 v-else-if="item.data?.kind==='remove'"/>
        <span>{{item.label}}</span>
        <small v-if="item.data?.hidden"><EyeOff/>Скрыт</small>
        <Check v-if="item.data?.active" class="menu-check"/>
        <span v-if="item.items" class="submenu-arrow">›</span>
      </a>
    </template>
  </ContextMenu>
</template>

<style scoped>
.lesson-context-trigger{display:contents}.lesson-block-menu a{display:flex;align-items:center;gap:.65rem}.lesson-block-menu a>svg{width:1rem}.lesson-block-menu a>span:nth-last-child(n+2){flex:1}.lesson-block-menu small{display:flex;align-items:center;gap:.3rem;color:var(--p-text-muted-color);font-size:.7rem}.lesson-block-menu small svg{width:.8rem}.lesson-block-menu .menu-check{margin-left:auto;color:var(--p-primary-color)}.lesson-block-menu .is-danger{color:var(--p-red-400)}.submenu-arrow{margin-left:auto}
</style>
