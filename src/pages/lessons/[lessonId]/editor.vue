<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { ArrowLeft, BookOpen, Brain, Check, ChevronRight, Dumbbell, Eye, FileText, GripVertical, Heading, Languages, LayoutTemplate, Link, ListChecks, MessageCircle, MessageSquare, Music2, Plus, Save, Search, Settings2, ShieldAlert, SlidersHorizontal, Text, Trash2, Upload } from 'lucide-vue-next'
import AppModal from '@/components/AppModal.vue'
import FullscreenLayout from '@/layouts/fullscreen.vue'
import UiButton from '@/components/ui/button/UiButton.vue'
import UiSwitch from '@/components/ui/switch/UiSwitch.vue'
import LessonAudioPlayer from '@/components/lesson/LessonAudioPlayer.vue'
import LessonPdfViewer from '@/components/lesson/LessonPdfViewer.vue'
import LessonBlockContextMenu from '@/components/lesson/editor/LessonBlockContextMenu.vue'
import { createLessonSectionConfig, resolveLessonBlockSection } from '@/composables/useCourseSections'
import { useCourseStore } from '@/stores/courses'
import type { BlockType, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'

const route = useRoute()
const store = useCourseStore()
const found = computed(() => store.findLesson(String(route.params.lessonId)))
const blocks = computed<LessonBlock[]>({ get:() => found.value?.lesson.blocks ?? [], set:(value) => { if(found.value)found.value.lesson.blocks=value } })
const sectionDraft = ref<LessonSectionConfig[]>([])
const selectedId = ref('')
const selected = computed(() => blocks.value.find((item) => item.id === selectedId.value) ?? blocks.value[0])
const selectedIndex = computed(() => selected.value ? blocks.value.findIndex((item) => item.id === selected.value?.id) : -1)
const paletteQuery = ref('')
const addQuery = ref('')
const insertAfterIndex = ref(-1)
const saving=ref(false), orderSaving=ref(false), saved=ref(false), uploading=ref(false), sectionSaving=ref(false), showSections=ref(false), showBlockPicker=ref(false), editorError=ref('')
let timer:ReturnType<typeof setTimeout>|undefined

const palette:Array<{type:BlockType;label:string;description:string;icon:typeof Heading}> = [
  {type:'heading',label:'Заголовок',description:'Название раздела',icon:Heading},
  {type:'grammar',label:'Теория',description:'Материал и объяснение',icon:BookOpen},
  {type:'pdf',label:'PDF-теория',description:'Документ внутри урока',icon:FileText},
  {type:'vocabulary',label:'Лексика',description:'Слова и примеры',icon:Languages},
  {type:'text',label:'Текст',description:'Дополнительное объяснение',icon:Text},
  {type:'callout',label:'Акцент',description:'Важная мысль',icon:MessageSquare},
  {type:'conversation',label:'Диалог',description:'Разговорная практика',icon:MessageCircle},
  {type:'audio',label:'Listening',description:'Файл или озвучка',icon:Music2},
  {type:'flashcards',label:'Карточки',description:'Интервальное повторение',icon:Brain},
  {type:'error_correction',label:'Ошибки',description:'Разбор ошибок',icon:ShieldAlert},
  {type:'translation',label:'Перевод',description:'Работа со смыслом',icon:Languages},
  {type:'practice',label:'Практика',description:'Активное задание',icon:Dumbbell},
  {type:'single_choice',label:'Вопрос теста',description:'Варианты и разбор',icon:ListChecks},
]
const labels:Record<BlockType,string> = { heading:'Заголовок',grammar:'Теория',pdf:'PDF-теория',vocabulary:'Лексика',text:'Текст',callout:'Акцент',conversation:'Диалог',audio:'Listening',flashcards:'Карточки',error_correction:'Разбор ошибок',translation:'Перевод',practice:'Практика',single_choice:'Вопрос теста' }
const filteredPalette = computed(() => filterPalette(paletteQuery.value))
const pickerPalette = computed(() => filterPalette(addQuery.value))
const availableSections = computed(() => createLessonSectionConfig(found.value?.lesson.sectionConfig))
const selectedSectionId = computed(() => selected.value ? resolveLessonBlockSection(selected.value) : 'theory')

function filterPalette(query:string){const normalized=query.trim().toLocaleLowerCase('ru');if(!normalized)return palette;return palette.filter((item)=>`${item.label} ${item.description}`.toLocaleLowerCase('ru').includes(normalized))}
function openBlockPicker(afterIndex=selectedIndex.value){insertAfterIndex.value=Math.max(-1,afterIndex);addQuery.value='';showBlockPicker.value=true}
async function add(type:BlockType,afterIndex=selectedIndex.value){
  if(!found.value)return
  const previousIds=new Set(blocks.value.map((item)=>item.id))
  const insertionIndex=Math.min(Math.max(afterIndex+1,0),blocks.value.length)
  await store.addBlock(found.value.lesson.id,type)
  const addedBlock=blocks.value.find((item)=>!previousIds.has(item.id))
  if(!addedBlock)return
  const currentIndex=blocks.value.findIndex((item)=>item.id===addedBlock.id)
  if(currentIndex!==insertionIndex){blocks.value.splice(currentIndex,1);blocks.value.splice(insertionIndex,0,addedBlock);await persistOrder()}
  selectedId.value=addedBlock.id
  await nextTick()
  document.querySelector<HTMLElement>(`[data-block-id="${addedBlock.id}"]`)?.scrollIntoView({behavior:'smooth',block:'center'})
}
async function chooseBlock(type:BlockType){const afterIndex=insertAfterIndex.value;showBlockPicker.value=false;await add(type,afterIndex)}
function scheduleSave(){saving.value=true;clearTimeout(timer);timer=setTimeout(async()=>{if(!found.value)return;try{await store.saveLesson(found.value.lesson.id);if(selected.value)await store.saveBlock(found.value.lesson.id,selected.value.id);saved.value=true;setTimeout(()=>saved.value=false,1200)}catch(error){editorError.value=error instanceof Error?error.message:'Не удалось сохранить'}finally{saving.value=false}},700)}
async function persistOrder(){if(!found.value)return;orderSaving.value=true;try{await store.persistBlockOrder(found.value.lesson.id);saved.value=true}catch(error){editorError.value=error instanceof Error?error.message:'Не удалось сохранить порядок'}finally{orderSaving.value=false}}
async function removeBlock(block:LessonBlock){
  if(!found.value)return
  const index=blocks.value.findIndex((item)=>item.id===block.id)
  selectedId.value=block.id
  editorError.value=''
  try{await store.removeBlock(found.value.lesson.id,block.id);selectedId.value=blocks.value[Math.min(index,blocks.value.length-1)]?.id??''}
  catch(error){editorError.value=error instanceof Error?error.message:'Не удалось удалить блок и связанный файл'}
}
async function remove(){if(selected.value)await removeBlock(selected.value)}
async function assignBlockSection(block:LessonBlock,sectionId:LessonSectionId){
  if(!found.value)return
  const previousSectionId=block.sectionId
  block.sectionId=sectionId
  selectedId.value=block.id
  saving.value=true
  editorError.value=''
  try{await store.saveBlock(found.value.lesson.id,block.id);saved.value=true;setTimeout(()=>saved.value=false,1200)}
  catch(error){block.sectionId=previousSectionId;editorError.value=error instanceof Error?error.message:'Не удалось изменить раздел блока'}
  finally{saving.value=false}
}
function assignSelectedSection(event:Event){if(selected.value)void assignBlockSection(selected.value,(event.target as HTMLSelectElement).value as LessonSectionId)}
async function publish(){if(!found.value)return;found.value.lesson.status='Опубликован';await store.saveLesson(found.value.lesson.id);saved.value=true}
function updateOptions(event:Event){if(!selected.value)return;selected.value.options=(event.target as HTMLTextAreaElement).value.split('\n').map((value)=>value.trim()).filter(Boolean);if((selected.value.correctOption??0)>=selected.value.options.length)selected.value.correctOption=0;scheduleSave()}
async function uploadAudioFile(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!found.value||!selected.value)return;uploading.value=true;editorError.value='';try{await store.uploadAudio(found.value.lesson.id,selected.value.id,file);saved.value=true}catch(error){editorError.value=error instanceof Error?error.message:'Не удалось загрузить аудио'}finally{uploading.value=false;(event.target as HTMLInputElement).value=''}}
async function uploadPdfFile(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!found.value||!selected.value)return;uploading.value=true;editorError.value='';try{await store.uploadPdf(found.value.lesson.id,selected.value.id,file);saved.value=true}catch(error){editorError.value=error instanceof Error?error.message:'Не удалось загрузить PDF'}finally{uploading.value=false;(event.target as HTMLInputElement).value=''}}
function openSections(){sectionDraft.value=createLessonSectionConfig(found.value?.lesson.sectionConfig);showSections.value=true}
async function saveSections(){if(!found.value)return;sectionSaving.value=true;editorError.value='';try{await store.saveLessonSections(found.value.lesson.id,sectionDraft.value);showSections.value=false;saved.value=true}catch(error){editorError.value=error instanceof Error?error.message:'Не удалось сохранить разделы'}finally{sectionSaving.value=false}}
</script>

<template>
  <FullscreenLayout>
  <div v-if="found" class="product-editor">
    <header class="product-editor-topbar">
      <RouterLink :to="`/app/courses/${found.course.id}`" class="editor-back"><ArrowLeft /></RouterLink>
      <div class="editor-crumbs"><span>{{ found.course.title }}</span><ChevronRight /><strong>{{ found.lesson.title }}</strong></div>
      <UiButton variant="secondary" @click="openSections"><SlidersHorizontal />Разделы</UiButton>
      <div class="editor-save-state"><span v-if="saving||orderSaving||uploading">Сохраняем…</span><span v-else-if="saved"><Check />Сохранено</span></div>
      <RouterLink :to="`/preview/lessons/${found.lesson.id}`" class="product-button product-button--secondary"><Eye />Предпросмотр</RouterLink>
      <UiButton @click="publish"><Save />{{ found.lesson.status==='Опубликован'?'Опубликовано':'Опубликовать' }}</UiButton>
    </header>

    <aside class="product-palette">
      <div class="palette-sticky-head">
        <div class="editor-panel-title"><LayoutTemplate /><div><strong>Библиотека урока</strong><small>Вставка после выбранного блока</small></div></div>
        <label class="palette-search"><Search /><input v-model="paletteQuery" type="search" placeholder="Найти формат…" aria-label="Найти формат блока" /></label>
      </div>
      <div class="palette-list"><button v-for="item in filteredPalette" :key="item.type" @click="add(item.type)"><span><component :is="item.icon" /></span><div><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div><Plus /></button></div>
      <p v-if="!filteredPalette.length" class="palette-empty">Ничего не найдено</p>
    </aside>

    <main class="product-canvas">
      <div v-if="editorError" class="product-alert is-error">{{ editorError }}</div>
      <div class="editor-document-head"><span>Урок · {{ found.lesson.duration }} минут · {{ blocks.filter((block)=>block.type==='single_choice').length }} вопросов</span><input v-model="found.lesson.title" aria-label="Название урока" @input="scheduleSave" /><p>Порядок блоков и доступность разделов настраиваются независимо.</p></div>
      <VueDraggable v-model="blocks" item-key="id" handle=".block-drag-handle" :animation="180" ghost-class="drag-ghost" :force-fallback="true" chosen-class="drag-chosen" class="editor-block-list" @end="persistOrder">
        <LessonBlockContextMenu v-for="(item,index) in blocks" :key="item.id" :block-label="labels[item.type]" :block-number="index+1" :sections="availableSections" :active-section-id="resolveLessonBlockSection(item)" @assign="sectionId=>assignBlockSection(item,sectionId)" @add-below="openBlockPicker(index)" @remove="removeBlock(item)">
        <article :data-block-id="item.id" :class="['product-editor-block',selected?.id===item.id&&'is-selected']" @click="selectedId=item.id" @contextmenu="selectedId=item.id">
          <button class="drag-handle block-drag-handle" aria-label="Переместить блок"><GripVertical /></button><div class="editor-block-number">{{ String(index+1).padStart(2,'0') }}</div>
          <div class="editor-block-content"><span>{{ labels[item.type] }}</span>
            <h2 v-if="item.type==='heading'">{{ item.content }}</h2>
            <p v-else-if="item.type==='text'">{{ item.content }}</p>
            <aside v-else-if="item.type==='callout'"><MessageSquare /><div><strong>{{ item.title }}</strong><p>{{ item.content }}</p></div></aside>
            <section v-else-if="item.type==='grammar'||item.type==='vocabulary'||item.type==='conversation'||item.type==='flashcards'||item.type==='error_correction'||item.type==='translation'||item.type==='practice'" class="editor-theory"><component :is="item.type==='grammar'?BookOpen:item.type==='conversation'?MessageCircle:item.type==='flashcards'?Brain:item.type==='error_correction'?ShieldAlert:item.type==='practice'?Dumbbell:Languages" /><div><strong>{{ item.title }}</strong><p>{{ item.content }}</p></div></section>
            <LessonAudioPlayer v-else-if="item.type==='audio'" :src="item.audioUrl" :title="item.title" :transcript="item.transcript" />
            <LessonPdfViewer v-else-if="item.type==='pdf'" :url="item.fileUrl" :title="item.title" :file-name="item.fileName" :file-size="item.fileSize" />
            <div v-else class="editor-question"><strong>{{ item.content }}</strong><span v-for="(option,optionIndex) in item.options" :key="`${option}-${optionIndex}`" :class="optionIndex===item.correctOption&&'is-correct'">{{ String.fromCharCode(65+optionIndex) }}. {{ option }}</span><small v-if="item.explanation">Разбор: {{ item.explanation }}</small></div>
          </div>
          <button class="editor-block-quick-add" :aria-label="`Добавить блок после ${index+1}`" title="Добавить блок ниже" @click.stop="openBlockPicker(index)"><Plus /></button>
        </article>
        </LessonBlockContextMenu>
      </VueDraggable>
      <button class="editor-insert" @click="openBlockPicker(blocks.length-1)"><Plus />Добавить блок в конец</button>
      <button class="editor-quick-add" @click="openBlockPicker()"><Plus /><span>Добавить после выбранного</span><small v-if="selectedIndex>=0">Блок {{ String(selectedIndex+1).padStart(2,'0') }}</small></button>
    </main>

    <aside class="product-inspector">
      <div class="editor-panel-title"><Settings2 /><div><strong>Настройки</strong><small>{{ selected?labels[selected.type]:'Блок не выбран' }}</small></div></div>
      <template v-if="selected">
        <label>Раздел урока<select :value="selectedSectionId" @change="assignSelectedSection"><option v-for="section in availableSections" :key="section.id" :value="section.id">{{ section.label }}{{ section.visible?'':' · скрыт' }}</option></select><small class="inspector-help">Блок сохранит свой формат, изменится только вкладка в уроке.</small></label>
        <label>Название блока<input v-model="selected.title" @input="scheduleSave" /></label>
        <label v-if="selected.type!=='audio'">Описание<textarea v-model="selected.content" @input="scheduleSave"></textarea></label>
        <template v-if="selected.type==='audio'">
          <div class="audio-upload-zone"><Music2 /><strong>{{ selected.audioUrl?'Аудио подключено':'Добавьте запись' }}</strong><small>MP3, M4A, OGG или WAV · до 50 МБ</small><label class="audio-upload-button"><Upload />{{ uploading?'Загрузка…':'Выбрать файл' }}<input type="file" accept="audio/mpeg,audio/mp4,audio/ogg,audio/wav" :disabled="uploading" @change="uploadAudioFile" /></label></div>
          <label><Link /> Внешняя ссылка<input v-model="selected.audioUrl" placeholder="https://…/recording.mp3" @change="scheduleSave" /></label>
          <label>Транскрипт<textarea v-model="selected.transcript" class="large-textarea" placeholder="English transcript…" @input="scheduleSave"></textarea></label>
        </template>
        <template v-if="selected.type==='pdf'">
          <div class="audio-upload-zone"><FileText /><strong>{{ selected.fileUrl?'PDF подключён':'Добавьте PDF с теорией' }}</strong><small>PDF · до 100 МБ</small><label class="audio-upload-button"><Upload />{{ uploading?'Загрузка…':'Выбрать PDF' }}<input type="file" accept="application/pdf,.pdf" :disabled="uploading" @change="uploadPdfFile" /></label></div>
          <LessonPdfViewer v-if="selected.fileUrl" :url="selected.fileUrl" :title="selected.title" :file-name="selected.fileName" :file-size="selected.fileSize" />
        </template>
        <template v-if="selected.type==='single_choice'">
          <label>Варианты — каждый с новой строки<textarea :value="selected.options?.join('\n')" @input="updateOptions"></textarea></label>
          <label>Правильный ответ<select v-model.number="selected.correctOption" @change="scheduleSave"><option v-for="(option,optionIndex) in selected.options" :key="optionIndex" :value="optionIndex">{{ String.fromCharCode(65+optionIndex) }}. {{ option }}</option></select></label>
          <label>Объяснение<textarea v-model="selected.explanation" @input="scheduleSave"></textarea></label>
        </template>
        <div class="inspector-row"><div><strong>Обязательный</strong><small>Нужен для завершения</small></div><UiSwitch v-model="selected.required" @update:model-value="scheduleSave" /></div>
        <button class="inspector-delete" @click="remove"><Trash2 />Удалить блок</button>
      </template>
    </aside>

    <AppModal v-if="showSections" title="Разделы урока" @close="showSections=false">
      <div class="lesson-section-settings"><p>Меняйте названия и порядок. Ненужные разделы можно выключить — материалы сохранятся.</p>
        <VueDraggable v-model="sectionDraft" item-key="id" handle=".section-drag-handle" :animation="160" class="lesson-section-list">
          <article v-for="section in sectionDraft" :key="section.id"><button class="drag-handle section-drag-handle" aria-label="Изменить порядок"><GripVertical /></button><label><small>Название</small><input v-model="section.label" /></label><div><small>Доступен в уроке</small><UiSwitch v-model="section.visible" /></div></article>
        </VueDraggable>
        <div class="form-actions"><UiButton variant="secondary" @click="showSections=false">Отмена</UiButton><UiButton :disabled="sectionSaving" @click="saveSections">{{ sectionSaving?'Сохраняем…':'Сохранить разделы' }}</UiButton></div>
      </div>
    </AppModal>

    <AppModal v-if="showBlockPicker" title="Добавить блок" @close="showBlockPicker=false">
      <div class="block-picker">
        <div class="block-picker-target"><Plus /><span><strong>Место вставки</strong><small>{{ insertAfterIndex<0?'В начало урока':`После блока ${String(insertAfterIndex+1).padStart(2,'0')}` }}</small></span></div>
        <label class="block-picker-search"><Search /><input v-model="addQuery" type="search" placeholder="Теория, Listening, тест…" autofocus /></label>
        <div class="block-picker-grid"><button v-for="item in pickerPalette" :key="item.type" @click="chooseBlock(item.type)"><span><component :is="item.icon" /></span><div><strong>{{ item.label }}</strong><small>{{ item.description }}</small></div><Plus /></button></div>
        <p v-if="!pickerPalette.length" class="palette-empty">Формат не найден</p>
      </div>
    </AppModal>
  </div>
  <section v-else class="product-empty full"><LayoutTemplate /><h2>Урок не найден</h2><RouterLink to="/app/courses" class="product-button">Вернуться к курсам</RouterLink></section>
  </FullscreenLayout>
</template>
