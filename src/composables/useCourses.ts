import { computed } from 'vue'
import { useCourseStore } from '@/stores/courses'
import type { Activity } from '@/types/course'
import { isSupabaseConfigured } from '@/services/supabase'
const activities:Activity[]=[{initials:'АК',color:'#f1d7c8',name:'Анна Крылова',action:'завершила урок «Знакомство и приветствия»',time:'12 мин'},{initials:'МС',color:'#d8e1ef',name:'Михаил Соколов',action:'начал курс «Business English»',time:'34 мин'},{initials:'ЕВ',color:'#ded7ef',name:'Елена Волкова',action:'набрала 90% в тесте по фонетике',time:'1 ч'}]
export function useCourses(){const store=useCourseStore();return{courses:computed(()=>store.courses),activities:isSupabaseConfigured?[]:activities,store}}