import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { BlockType, Course, Lesson, LessonBlock, LessonSectionConfig, LessonSectionId } from '@/types/course'
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase'
import { useAuthStore } from '@/stores/auth'
import { slugify } from '@/utils/slugify'
import { buildEnglishEngineDemoCourse, seedEnglishEngineCourse } from '@/services/seed-english-engine'
import { createLessonAudioUrl, uploadLessonAudio } from '@/services/lesson-audio.service'
import { createLessonPdfUrl, uploadLessonPdf } from '@/services/lesson-pdf.service'
import { deleteLessonAssets, releaseLessonObjectUrls } from '@/services/lesson-assets.service'
import { createLessonSectionConfig } from '@/composables/useCourseSections'

const makeBlock = (id:string, type:BlockType, title:string, content:string, extra:Partial<LessonBlock> = {}):LessonBlock => ({ id, type, title, content, required: true, ...extra })
const demoCourses:Course[] = [buildEnglishEngineDemoCourse()]
const dbType = (type:BlockType) => ({ text:'rich_text', conversation:'open_answer', error_correction:'grammar', practice:'homework', pdf:'file' } as Partial<Record<BlockType,string>>)[type] ?? type
const asRecord = (value:unknown):Record<string,unknown> => value && typeof value === 'object' ? value as Record<string,unknown> : {}
const defaultLessonSectionsIds = new Set<LessonSectionId>(['theory','conversation','listening','cards','errors','translation','practice','test'])
const COURSES_CACHE_PREFIX = 'course-platform-cache-v1-'

export const useCourseStore = defineStore('courses', () => {
  const saved = localStorage.getItem('cursor-courses-v3')
  const courses = ref<Course[]>(isSupabaseConfigured ? [] : (saved ? JSON.parse(saved) : demoCourses))
  const loading = ref(false)
  const loadError = ref('')
  let hydratedOrganizationId = ''
  let bootstrapPromise:Promise<void>|undefined
  let refreshPromise:Promise<void>|undefined
  if (!isSupabaseConfigured) watch(courses, (value) => localStorage.setItem('cursor-courses-v3', JSON.stringify(value)), { deep:true })

  const totalLessons = computed(() => courses.value.reduce((sum, course) => sum + course.modules.reduce((value, module) => value + module.lessons.length, 0), 0))
  const findCourse = (id:string) => courses.value.find((course) => course.id === id)
  const findLesson = (id:string) => {
    for (const course of courses.value) for (const module of course.modules) {
      const lesson = module.lessons.find((item) => item.id === id)
      if (lesson) return { course, module, lesson }
    }
  }

  function parseSectionConfig(value:unknown):LessonSectionConfig[] {
    if (!Array.isArray(value)) return createLessonSectionConfig()
    const sections = value.filter((item) => item && typeof item === 'object').map((item, index) => {
      const section = item as Record<string,unknown>
      return { id:String(section.id), label:String(section.label ?? ''), visible:section.visible !== false, order:Number(section.order ?? index) }
    }) as LessonSectionConfig[]
    return createLessonSectionConfig(sections)
  }
  function mapBlock(item:Record<string,unknown>):LessonBlock {
    const pub = asRecord(item.public_content)
    const priv = asRecord(item.private_content)
    const kind = String(pub.kind ?? '')
    const rawType = String(item.block_type)
    const type:BlockType = rawType === 'rich_text' ? 'text' : rawType === 'open_answer' && kind === 'conversation' ? 'conversation' : rawType === 'grammar' && kind === 'error_correction' ? 'error_correction' : rawType === 'homework' ? 'practice' : rawType === 'file' && kind === 'pdf' ? 'pdf' : rawType as BlockType
    const cards = Array.isArray(pub.cards) ? pub.cards.map((card) => { const value=asRecord(card);return { front:String(value.front??''), back:String(value.back??''), hint:String(value.hint??'') } }) : undefined
    const corrections = Array.isArray(pub.items) ? pub.items.map((row) => { const value=asRecord(row);return { incorrect:String(value.incorrect??''), correct:String(value.correct??''), explanation:String(value.explanation??'') } }) : undefined
    return {
      id:String(item.id), type, title:String(item.title??''), content:String(pub.content??pub.text??pub.question??''), required:Boolean(item.is_required),
      sectionId:defaultLessonSectionsIds.has(String(pub.sectionId) as LessonSectionId) ? String(pub.sectionId) as LessonSectionId : undefined,
      options:Array.isArray(pub.options) ? pub.options.map((option) => typeof option === 'string' ? option : String(asRecord(option).label??'')) : undefined,
      correctOption:typeof priv.correctOption === 'number' ? priv.correctOption : undefined, explanation:String(priv.explanation??''),
      audioPath:String(pub.audioPath??''), audioUrl:String(pub.audioUrl??''), transcript:String(pub.transcript??''),
      filePath:String(pub.filePath??''), fileUrl:String(pub.fileUrl??''), fileName:String(pub.fileName??''), fileSize:typeof pub.fileSize === 'number' ? pub.fileSize : undefined,
      cards, role:String(pub.role??''), prompt:String(pub.prompt??''), starter:String(pub.starter??''), sampleAnswer:String(pub.sampleAnswer??''), corrections,
      sourceText:String(pub.sourceText??''), targetText:String(priv.targetText??''), comprehensionQuestions:Array.isArray(pub.questions) ? pub.questions.map(String) : undefined,
    }
  }
  function mapLesson(row:Record<string,unknown>):Lesson {
    const rawBlocks = ((row.lesson_blocks ?? []) as Record<string,unknown>[]).sort((left,right) => Number(left.position)-Number(right.position))
    const configBlock = rawBlocks.find((block) => asRecord(block.public_content).kind === 'section_config')
    return {
      id:String(row.id), title:String(row.title), duration:Number(row.duration_minutes), status:row.status === 'published' ? 'Опубликован' : 'Черновик',
      blocks:rawBlocks.filter((block) => asRecord(block.public_content).kind !== 'section_config').map(mapBlock),
      sectionConfig:parseSectionConfig(configBlock ? asRecord(configBlock.public_content).sections : undefined),
      sectionConfigBlockId:configBlock ? String(configBlock.id) : undefined,
    }
  }
  function mapDbCourse(row:Record<string,unknown>):Course {
    const modules = ((row.course_modules??[]) as Record<string,unknown>[]).sort((left,right) => Number(left.position)-Number(right.position)).map((module) => ({
      id:String(module.id), title:String(module.title), open:true,
      lessons:((module.lessons??[]) as Record<string,unknown>[]).sort((left,right) => Number(left.position)-Number(right.position)).map(mapLesson),
    }))
    return { id:String(row.id), title:String(row.title), description:String(row.description??''), cover:`linear-gradient(135deg,${String(row.accent_color??'#3AC3A6')},#142d39)`, tag:String(row.target_level??'КУРС'), status:row.status === 'published' ? 'Опубликован' : 'Черновик', updated:new Date(String(row.updated_at)).toLocaleDateString('ru-RU'), modules }
  }
  async function resolveAssetUrls() {
    await Promise.all(courses.value.flatMap((course) => course.modules.flatMap((module) => module.lessons.flatMap((lesson) => lesson.blocks.map(async (block) => {
      try {
        if (block.audioPath) block.audioUrl = await createLessonAudioUrl(block.audioPath)
        if (block.filePath) block.fileUrl = await createLessonPdfUrl(block.filePath)
      } catch { if (block.audioPath) block.audioUrl='';if(block.filePath)block.fileUrl='' }
    })))))
  }
  function readCourseCache(organizationId:string):Course[] {
    try {
      const cached=sessionStorage.getItem(COURSES_CACHE_PREFIX+organizationId)
      if(!cached)return[]
      const value=JSON.parse(cached) as unknown
      return Array.isArray(value)?value as Course[]:[]
    } catch { return[] }
  }
  function writeCourseCache(organizationId:string){
    try{sessionStorage.setItem(COURSES_CACHE_PREFIX+organizationId,JSON.stringify(courses.value))}catch{return}
  }
  function refreshCourses(organizationId:string,userId:string):Promise<void>{
    if(refreshPromise)return refreshPromise
    refreshPromise=(async()=>{
      loadError.value=''
      if(!courses.value.length)loading.value=true
      try{
        const seedKey='english-engine-seeded-v1-'+organizationId
        if(localStorage.getItem(seedKey)!=='true'){await seedEnglishEngineCourse(organizationId,userId);localStorage.setItem(seedKey,'true')}
        const{data,error}=await requireSupabase().from('courses').select('id,title,description,status,target_level,accent_color,updated_at,course_modules(id,title,position,lessons(id,title,duration_minutes,status,position,lesson_blocks(id,block_type,title,public_content,private_content,is_required,position)))').eq('organization_id',organizationId).order('updated_at',{ascending:false})
        if(error)throw error
        courses.value=((data??[])as unknown as Record<string,unknown>[]).map(mapDbCourse)
        await resolveAssetUrls()
        hydratedOrganizationId=organizationId
        writeCourseCache(organizationId)
      }catch(error){loadError.value=error instanceof Error?error.message:'Не удалось загрузить курсы'}
      finally{loading.value=false}
    })().finally(()=>{refreshPromise=undefined})
    return refreshPromise
  }
  function hydrate(force=false):Promise<void>{
    if(!isSupabaseConfigured)return Promise.resolve()
    const currentOrganizationId=useAuthStore().organization?.id
    if(!force&&currentOrganizationId&&hydratedOrganizationId===currentOrganizationId)return Promise.resolve()
    if(refreshPromise)return courses.value.length&&!force?Promise.resolve():refreshPromise
    if(bootstrapPromise)return bootstrapPromise
    bootstrapPromise=(async()=>{
      const auth=useAuthStore()
      if(!auth.organization)await auth.loadOrganization()
      if(!auth.organization||!auth.user){courses.value=[];return}
      if(!force&&hydratedOrganizationId===auth.organization.id)return
      if(hydratedOrganizationId&&hydratedOrganizationId!==auth.organization.id)courses.value=[]
      if(!force&&!courses.value.length){
        const cached=readCourseCache(auth.organization.id)
        if(cached.length){courses.value=cached;hydratedOrganizationId=auth.organization.id;loading.value=false;void refreshCourses(auth.organization.id,auth.user.id);return}
      }
      await refreshCourses(auth.organization.id,auth.user.id)
    })().catch((error)=>{loadError.value=error instanceof Error?error.message:'Не удалось загрузить курсы';loading.value=false}).finally(()=>{bootstrapPromise=undefined})
    return bootstrapPromise
  }
  async function createCourse(title:string, description:string) {
    if (!isSupabaseConfigured) { const id=`course-${Date.now()}`;courses.value.unshift({id,title,description,cover:'linear-gradient(135deg,#176452,#3ac3a6)',tag:'EN',status:'Черновик',updated:'Только что',modules:[]});return id }
    const auth=useAuthStore();if(!auth.organization||!auth.user)throw new Error('Организация пользователя не найдена')
    const { data,error }=await requireSupabase().from('courses').insert({organization_id:auth.organization.id,owner_id:auth.user.id,title,description,slug:slugify(title,'course'),language_code:'en',source_level:'A0',target_level:'B2'}).select('id').single();if(error)throw error;await hydrate(true);return String(data.id)
  }
  async function addModule(courseId:string,title='Новый модуль'){const course=findCourse(courseId);if(!course)return;if(!isSupabaseConfigured){course.modules.push({id:`module-${Date.now()}`,title,open:true,lessons:[]});return}const{error}=await requireSupabase().from('course_modules').insert({course_id:courseId,title,position:course.modules.length});if(error)throw error;await hydrate(true)}
  async function addLesson(courseId:string,moduleId:string,title='Новый урок'){const module=findCourse(courseId)?.modules.find((item)=>item.id===moduleId);if(!module)return;if(!isSupabaseConfigured){const id=`lesson-${Date.now()}`;module.lessons.push({id,title,duration:45,status:'Черновик',blocks:[],sectionConfig:createLessonSectionConfig()});return id}const{data,error}=await requireSupabase().from('lessons').insert({course_id:courseId,module_id:moduleId,title,slug:slugify(title,'lesson'),duration_minutes:45,position:module.lessons.length}).select('id').single();if(error)throw error;await hydrate(true);return String(data.id)}

  const defaults:Record<BlockType,[string,string,Partial<LessonBlock>?]> = {
    heading:['Заголовок','Новый раздел'], text:['Текст','Добавьте объяснение и примеры.'], callout:['Важно','Добавьте ключевую мысль.'], grammar:['Теория','Подробно объясните материал.'], vocabulary:['Словарь','Добавьте термины и примеры.'], practice:['Практика','Добавьте активное задание.'],
    audio:['Аудирование','Прослушайте запись.',{transcript:'Add the transcript here.'}], pdf:['Теория в PDF','Откройте документ и изучите материал.',{fileName:'lesson.pdf'}],
    conversation:['Диалог','Опишите ситуацию разговора.',{role:'Собеседник',starter:'Начните разговор.',sampleAnswer:'Sample answer'}], flashcards:['Карточки','Добавьте карточки.',{cards:[]}], error_correction:['Разбор ошибок','Добавьте типичные ошибки.',{corrections:[]}], translation:['Перевод','Переведите текст.',{sourceText:'Исходный текст',targetText:'Model translation'}], single_choice:['Вопрос','Введите вопрос',{options:['Вариант 1','Вариант 2','Вариант 3','Вариант 4'],correctOption:0,explanation:'Объяснение ответа.'}],
  }
  function publicContent(item:LessonBlock):Record<string,unknown> {
    if(item.type==='single_choice')return{question:item.content,sectionId:item.sectionId,options:item.options?.map((label,index)=>({id:String(index),label}))}
    if(item.type==='conversation')return{kind:'conversation',sectionId:item.sectionId,content:item.content,role:item.role,prompt:item.prompt,starter:item.starter,sampleAnswer:item.sampleAnswer}
    if(item.type==='flashcards')return{kind:'flashcards',sectionId:item.sectionId,content:item.content,cards:item.cards}
    if(item.type==='error_correction')return{kind:'error_correction',sectionId:item.sectionId,content:item.content,items:item.corrections}
    if(item.type==='translation')return{kind:'translation',sectionId:item.sectionId,content:item.content,sourceText:item.sourceText,questions:item.comprehensionQuestions}
    if(item.type==='pdf')return{kind:'pdf',sectionId:item.sectionId,content:item.content,filePath:item.filePath,fileUrl:item.filePath?undefined:item.fileUrl,fileName:item.fileName,fileSize:item.fileSize}
    return{kind:item.type,sectionId:item.sectionId,content:item.content,audioPath:item.audioPath,audioUrl:item.audioPath?undefined:item.audioUrl,transcript:item.transcript}
  }
  function privateContent(item:LessonBlock){return item.type==='single_choice'?{correctOption:item.correctOption??0,explanation:item.explanation??''}:item.type==='translation'?{targetText:item.targetText}:{}}
  async function addBlock(lessonId:string,type:BlockType){const found=findLesson(lessonId);if(!found)return;const[title,content,extra={}]=defaults[type];if(!isSupabaseConfigured){found.lesson.blocks.push(makeBlock(`block-${Date.now()}`,type,title,content,extra));return}const item=makeBlock('',type,title,content,extra);const{error}=await requireSupabase().from('lesson_blocks').insert({course_id:found.course.id,lesson_id:lessonId,block_type:dbType(type),title,public_content:publicContent(item),private_content:privateContent(item),position:found.lesson.blocks.length});if(error)throw error;await hydrate(true)}
  async function saveLesson(lessonId:string){const found=findLesson(lessonId);if(!found||!isSupabaseConfigured)return;const{error}=await requireSupabase().from('lessons').update({title:found.lesson.title,duration_minutes:found.lesson.duration,status:found.lesson.status==='Опубликован'?'published':'draft'}).eq('id',lessonId);if(error)throw error}
  async function saveBlock(lessonId:string,blockId:string){if(!isSupabaseConfigured)return;const item=findLesson(lessonId)?.lesson.blocks.find((block)=>block.id===blockId);if(!item)return;const{error}=await requireSupabase().from('lesson_blocks').update({title:item.title,public_content:publicContent(item),private_content:privateContent(item),is_required:item.required}).eq('id',blockId);if(error)throw error}
  async function saveLessonSections(lessonId:string,sections:LessonSectionConfig[]){const found=findLesson(lessonId);if(!found)return;found.lesson.sectionConfig=createLessonSectionConfig(sections);if(!isSupabaseConfigured)return;const payload={kind:'section_config',sections:found.lesson.sectionConfig};if(found.lesson.sectionConfigBlockId){const{error}=await requireSupabase().from('lesson_blocks').update({public_content:payload}).eq('id',found.lesson.sectionConfigBlockId);if(error)throw error;return}const{data,error}=await requireSupabase().from('lesson_blocks').insert({course_id:found.course.id,lesson_id:lessonId,block_type:'summary',title:'Настройки разделов',public_content:payload,private_content:{},is_required:false,position:9999}).select('id').single();if(error)throw error;found.lesson.sectionConfigBlockId=String(data.id)}
  async function uploadAudio(lessonId:string,blockId:string,file:File){const found=findLesson(lessonId),item=found?.lesson.blocks.find((block)=>block.id===blockId);if(!found||!item||item.type!=='audio')throw new Error('Выберите аудиоблок');const auth=useAuthStore();const uploaded=await uploadLessonAudio({organizationId:auth.organization?.id??'demo',courseId:found.course.id,lessonId,blockId,file});item.audioPath=uploaded.path;item.audioUrl=uploaded.url;await saveBlock(lessonId,blockId)}
  async function uploadPdf(lessonId:string,blockId:string,file:File){const found=findLesson(lessonId),item=found?.lesson.blocks.find((block)=>block.id===blockId);if(!found||!item||item.type!=='pdf')throw new Error('Выберите PDF-блок');const auth=useAuthStore();const uploaded=await uploadLessonPdf({organizationId:auth.organization?.id??'demo',courseId:found.course.id,lessonId,blockId,file});item.filePath=uploaded.path;item.fileUrl=uploaded.url;item.fileName=uploaded.name;item.fileSize=uploaded.size;await saveBlock(lessonId,blockId)}
  async function removeBlock(lessonId:string,blockId:string){
    const found=findLesson(lessonId)
    const block=found?.lesson.blocks.find((item)=>item.id===blockId)
    if(!found||!block)return
    if(isSupabaseConfigured){
      await deleteLessonAssets([block.audioPath,block.filePath])
      const{error}=await requireSupabase().from('lesson_blocks').delete().eq('id',blockId)
      if(error)throw error
    }else{
      releaseLessonObjectUrls([block.audioUrl,block.fileUrl])
    }
    found.lesson.blocks=found.lesson.blocks.filter((item)=>item.id!==blockId)
  }
  async function saveCourse(courseId:string){const course=findCourse(courseId);if(!course||!isSupabaseConfigured)return;const{error}=await requireSupabase().from('courses').update({title:course.title,description:course.description}).eq('id',courseId);if(error)throw error;course.updated='Только что'}
  async function deleteCourse(courseId:string){const index=courses.value.findIndex((course)=>course.id===courseId);if(index<0)return;if(isSupabaseConfigured){const{error}=await requireSupabase().from('courses').delete().eq('id',courseId);if(error)throw error}courses.value.splice(index,1)}
  async function publishCourse(id:string){if(!isSupabaseConfigured){const course=findCourse(id);if(course)course.status='Опубликован';return}const{error}=await requireSupabase().rpc('publish_course',{p_course_id:id,p_changelog:'Published from Course Platform'});if(error)throw error;await hydrate(true)}
  async function persistCourseOrder(courseId:string){const course=findCourse(courseId);if(!course||!isSupabaseConfigured)return;const moduleResults=await Promise.all(course.modules.map((module,position)=>requireSupabase().from('course_modules').update({position}).eq('id',module.id)));const moduleError=moduleResults.find((result)=>result.error)?.error;if(moduleError)throw moduleError;const lessonResults=await Promise.all(course.modules.flatMap((module)=>module.lessons.map((lesson,position)=>requireSupabase().from('lessons').update({module_id:module.id,position}).eq('id',lesson.id))));const lessonError=lessonResults.find((result)=>result.error)?.error;if(lessonError)throw lessonError}
  async function persistBlockOrder(lessonId:string){const found=findLesson(lessonId);if(!found||!isSupabaseConfigured)return;const results=await Promise.all(found.lesson.blocks.map((item,position)=>requireSupabase().from('lesson_blocks').update({position}).eq('id',item.id)));const error=results.find((result)=>result.error)?.error;if(error)throw error}
  function resetDemo(){if(!isSupabaseConfigured){courses.value=structuredClone(demoCourses);localStorage.removeItem('cursor-courses-v3')}}

  return { courses,loading,loadError,totalLessons,findCourse,findLesson,hydrate,createCourse,addModule,addLesson,addBlock,saveLesson,saveBlock,saveLessonSections,uploadAudio,uploadPdf,removeBlock,saveCourse,deleteCourse,publishCourse,persistCourseOrder,persistBlockOrder,resetDemo }
})
