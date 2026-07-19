import { createRouter, createWebHistory } from 'vue-router'
import { isSupabaseConfigured, supabase } from '@/services/supabase'
export const router=createRouter({history:createWebHistory(),routes:[
{path:'/',redirect:'/app'},{path:'/auth',component:()=>import('@/pages/auth/index.vue'),meta:{guest:true}},
{path:'/app',component:()=>import('@/pages/index.vue'),meta:{title:'Обзор',auth:true}},
{path:'/app/courses',component:()=>import('@/pages/courses/index.vue'),meta:{title:'Курсы',auth:true}},
{path:'/app/courses/:courseId',component:()=>import('@/pages/courses/[courseId].vue'),meta:{title:'Программа курса',auth:true}},
{path:'/app/lessons/:lessonId/editor',component:()=>import('@/pages/lessons/[lessonId]/editor.vue'),meta:{title:'Редактор урока',loadingLabel:'Открываем редактор урока',auth:true}},
{path:'/preview/courses/:courseId',component:()=>import('@/pages/preview/courses/[courseId].vue'),meta:{loadingLabel:'Открываем курс',auth:true}},
{path:'/preview/lessons/:lessonId',component:()=>import('@/pages/preview/lessons/[lessonId].vue'),meta:{loadingLabel:'Открываем урок',auth:true}},
{path:'/app/:section(learners|analytics|integrations|settings)',component:()=>import('@/pages/[section].vue'),meta:{auth:true}},
{path:'/:pathMatch(.*)*',redirect:'/app'}]})
router.beforeEach(async to=>{if(!isSupabaseConfigured)return true;const{data}=await supabase!.auth.getSession();const signedIn=Boolean(data.session);if(to.meta.auth&&!signedIn)return{path:'/auth',query:{redirect:to.fullPath}};if(to.meta.guest&&signedIn)return'/app';return true})
