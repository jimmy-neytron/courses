<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, CheckCircle2, Headphones, Languages, MessageCircle, MessageSquare, ShieldAlert, XCircle } from 'lucide-vue-next'
import LessonAudioPlayer from '@/components/lesson/LessonAudioPlayer.vue'
import LessonPdfViewer from '@/components/lesson/LessonPdfViewer.vue'
import ConversationPractice from '@/components/lesson/engine/ConversationPractice.vue'
import FlashcardDeck from '@/components/lesson/engine/FlashcardDeck.vue'
import ErrorClinic from '@/components/lesson/engine/ErrorClinic.vue'
import TranslationPractice from '@/components/lesson/engine/TranslationPractice.vue'
import ActivePractice from '@/components/lesson/engine/ActivePractice.vue'
import { useLearningProgress } from '@/composables/useLearningProgress'
import { createLessonSectionConfig, resolveLessonBlockSection } from '@/composables/useCourseSections'
import { useCourseStore } from '@/stores/courses'
import type { Lesson, LessonBlock, LessonSectionId } from '@/types/course'

const props = defineProps<{ lesson:Lesson }>()
const store = useCourseStore()
const progress = useLearningProgress()
const active = ref<LessonSectionId>('theory')
const answers = ref<Record<string,number>>({})
const completedSections = ref<string[]>([...progress.sections(props.lesson.id)])
const iconMap = { theory:BookOpen, conversation:MessageCircle, listening:Headphones, cards:Brain, errors:ShieldAlert, translation:Languages, practice:Check, test:CheckCircle2 }

const sections = computed(() => createLessonSectionConfig(props.lesson.sectionConfig).filter((config) => config.visible).map((config) => ({
  ...config,
  icon:iconMap[config.id],
  blocks:props.lesson.blocks.filter((block) => resolveLessonBlockSection(block) === config.id),
})).filter((section) => section.blocks.length))
const current = computed(() => sections.value.find((section) => section.id === active.value) ?? sections.value[0])
const currentQuestions = computed(() => current.value?.blocks.filter((block) => block.type === 'single_choice') ?? [])
const questions = computed(() => props.lesson.blocks.filter((block) => block.type === 'single_choice'))
const answered = computed(() => questions.value.filter((block) => answers.value[block.id] !== undefined).length)
const correct = computed(() => questions.value.filter((block) => answers.value[block.id] === block.correctOption).length)
const found = computed(() => store.findLesson(props.lesson.id))
const courseTitle = computed(() => found.value?.course.title ?? 'Учебный курс')
const allLessons = computed(() => found.value?.course.modules.flatMap((module) => module.lessons) ?? [])
const lessonIndex = computed(() => allLessons.value.findIndex((item) => item.id === props.lesson.id))
const previous = computed(() => allLessons.value[lessonIndex.value - 1])
const next = computed(() => allLessons.value[lessonIndex.value + 1])
const canFinish = computed(() => sections.value.every((section) => completedSections.value.includes(section.id)) && answered.value === questions.value.length)

watch(() => props.lesson.id, () => {
  active.value = sections.value[0]?.id ?? 'theory'
  answers.value = {}
  completedSections.value = [...progress.sections(props.lesson.id)]
})
function mark(section:string) { if(!completedSections.value.includes(section))completedSections.value.push(section);progress.markSection(props.lesson.id,section) }
function answer(block:LessonBlock,index:number,sectionId:LessonSectionId) {
  answers.value[block.id]=index
  const sectionQuestions=sections.value.find((section)=>section.id===sectionId)?.blocks.filter((item)=>item.type==='single_choice')??[]
  if(sectionQuestions.length&&sectionQuestions.every((item)=>answers.value[item.id]!==undefined))mark(sectionId)
}
function testNumber(block:LessonBlock){return questions.value.findIndex((item)=>item.id===block.id)+1}
function finish() { if(canFinish.value)progress.completeLesson(props.lesson.id) }
</script>

<template>
  <div class="engine-player">
    <header class="engine-lesson-header">
      <div><p class="eyebrow">{{ courseTitle }} · {{ lesson.duration }} минут</p><h1>{{ lesson.title }}</h1><p>{{ sections.length }} разделов · {{ questions.length }} вопросов</p></div>
      <span v-if="progress.isCompleted(lesson.id)" class="engine-complete"><CheckCircle2 />Урок завершён</span>
    </header>
    <nav v-if="sections.length" class="engine-section-nav" aria-label="Разделы урока">
      <button v-for="section in sections" :key="section.id" :class="{ active:active===section.id, done:completedSections.includes(section.id) }" @click="active=section.id">
        <component :is="section.icon" /><span>{{ section.label }}</span><Check v-if="completedSections.includes(section.id)" class="section-check" />
      </button>
    </nav>
    <main v-if="current" class="engine-lesson-body">
      <div class="engine-section-title"><component :is="current.icon" /><div><small>Раздел урока</small><h2>{{ current.label }}</h2></div><span>{{ current.blocks.length }} блоков</span></div>
      <template v-for="block in current.blocks" :key="block.id">
        <LessonPdfViewer v-if="block.type==='pdf'" :url="block.fileUrl" :title="block.title" :file-name="block.fileName" :file-size="block.fileSize" />
        <LessonAudioPlayer v-else-if="block.type==='audio'" :src="block.audioUrl" :title="block.title" :transcript="block.transcript" @completed="mark(current.id)" />
        <ConversationPractice v-else-if="block.type==='conversation'" v-bind="{role:block.role,prompt:block.prompt,starter:block.starter,sample:block.sampleAnswer}" @complete="mark(current.id)" />
        <FlashcardDeck v-else-if="block.type==='flashcards'" :cards="block.cards??[]" @complete="mark(current.id)" />
        <ErrorClinic v-else-if="block.type==='error_correction'" :items="block.corrections??[]" @complete="mark(current.id)" />
        <TranslationPractice v-else-if="block.type==='translation'" :source="block.sourceText" :target="block.targetText" :questions="block.comprehensionQuestions" @complete="mark(current.id)" />
        <ActivePractice v-else-if="block.type==='practice'" :title="block.title" :content="block.content" @complete="mark(current.id)" />
        <section v-else-if="block.type==='single_choice'" class="engine-test-question">
          <small>{{ block.title }}</small><h3>{{ testNumber(block) }}. {{ block.content }}</h3>
          <button v-for="(option,optionIndex) in block.options" :key="option" :class="{selected:answers[block.id]===optionIndex,correct:answers[block.id]!==undefined&&optionIndex===block.correctOption,wrong:answers[block.id]===optionIndex&&optionIndex!==block.correctOption}" @click="answer(block,optionIndex,current.id)">{{ option }}<CheckCircle2 v-if="answers[block.id]!==undefined&&optionIndex===block.correctOption" /><XCircle v-else-if="answers[block.id]===optionIndex" /></button>
          <div v-if="answers[block.id]!==undefined" class="engine-test-explanation"><b>{{ answers[block.id]===block.correctOption?'Верно':'Ошибка разобрана' }}</b><p>{{ block.explanation }}</p><button v-if="sections.some(section=>section.id==='theory')" @click="active='theory'"><BookOpen />Перейти к теории</button></div>
        </section>
        <article v-else :class="['engine-theory-block',block.type]">
          <h2 v-if="block.type==='heading'">{{ block.content }}</h2>
          <section v-else-if="block.type==='grammar'"><small>Теоретический материал</small><h3>{{ block.title }}</h3><p>{{ block.content }}</p></section>
          <aside v-else-if="block.type==='callout'"><MessageSquare /><div><b>{{ block.title }}</b><p>{{ block.content }}</p></div></aside>
          <section v-else><h3>{{ block.title }}</h3><p>{{ block.content }}</p></section>
        </article>
      </template>
      <div v-if="currentQuestions.length && answered" class="engine-test-result"><span>Результат</span><strong>{{ correct }} из {{ questions.length }}</strong><p>{{ answered<questions.length?`Осталось ответить: ${questions.length-answered}`:correct===questions.length?'Все ответы верны':'Изучите объяснения и попробуйте ещё раз' }}</p></div>
      <button v-if="!currentQuestions.length" class="engine-section-complete" @click="mark(current.id)"><Check />{{ completedSections.includes(current.id)?'Раздел изучен':'Я изучил этот раздел' }}</button>
    </main>
    <section v-else class="product-empty compact"><BookOpen /><h3>В уроке пока нет доступных разделов</h3><p>Автор может включить разделы и добавить материалы в редакторе.</p></section>
    <footer class="engine-lesson-footer"><RouterLink v-if="previous" :to="`/preview/lessons/${previous.id}`"><ArrowLeft />{{ previous.title }}</RouterLink><span v-else></span><button :disabled="!canFinish" @click="finish"><CheckCircle2 />Завершить урок</button><RouterLink v-if="next" :to="`/preview/lessons/${next.id}`">Следующий урок<ArrowRight /></RouterLink><span v-else></span></footer>
  </div>
</template>