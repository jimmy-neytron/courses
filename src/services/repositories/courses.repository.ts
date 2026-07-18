import { requireSupabase } from '@/services/supabase'
export interface CourseRow{id:string;organization_id:string;title:string;slug:string;description:string|null;status:string;updated_at:string}
export const coursesRepository={
 async list(organizationId:string){const{data,error}=await requireSupabase().from('courses').select('id,organization_id,title,slug,description,status,updated_at').eq('organization_id',organizationId).order('updated_at',{ascending:false});if(error)throw error;return(data??[])as CourseRow[]},
 async create(input:{organization_id:string;title:string;slug:string;description?:string}){const{data,error}=await requireSupabase().from('courses').insert(input).select().single();if(error)throw error;return data as CourseRow},
 async update(id:string,input:Partial<Pick<CourseRow,'title'|'description'|'status'>>){const{data,error}=await requireSupabase().from('courses').update(input).eq('id',id).select().single();if(error)throw error;return data as CourseRow}
}