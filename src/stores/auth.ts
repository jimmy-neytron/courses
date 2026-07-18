import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/services/supabase'
export interface OrganizationContext { id:string; name:string; role:string }
export const useAuthStore=defineStore('auth',()=>{
 const session=ref<Session|null>(null),user=ref<User|null>(null),organization=ref<OrganizationContext|null>(null),loading=ref(true)
 const isAuthenticated=computed(()=>Boolean(session.value))
 async function loadOrganization(){if(!supabase||!user.value){organization.value=null;return}const{data,error}=await supabase.from('organization_members').select('role, organizations(id,name)').eq('user_id',user.value.id).limit(1).maybeSingle();if(error)throw error;const org=data?.organizations as unknown as {id:string;name:string}|null;organization.value=org?{id:org.id,name:org.name,role:String(data?.role??'viewer')}:null}
 async function initialize(){if(!supabase){loading.value=false;return}const{data}=await supabase.auth.getSession();session.value=data.session;user.value=data.session?.user??null;if(user.value)await loadOrganization();supabase.auth.onAuthStateChange((_event,next)=>{session.value=next;user.value=next?.user??null;if(next)setTimeout(()=>void loadOrganization(),0);else organization.value=null});loading.value=false}
 async function signIn(email:string,password:string){if(!supabase)throw new Error('Supabase не настроен');const{error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error}
 async function signUp(email:string,password:string,name:string){if(!supabase)throw new Error('Supabase не настроен');const{data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name}}});if(error)throw error;return Boolean(data.session)}
 async function updateProfile(displayName:string){if(!supabase||!user.value)return;const{error}=await supabase.auth.updateUser({data:{display_name:displayName}});if(error)throw error;const{error:profileError}=await supabase.from('profiles').update({display_name:displayName}).eq('id',user.value.id);if(profileError)throw profileError;const{data}=await supabase.auth.getUser();user.value=data.user}
 async function signOut(){await supabase?.auth.signOut();session.value=null;user.value=null;organization.value=null}
 return{session,user,organization,loading,isConfigured:isSupabaseConfigured,isAuthenticated,initialize,loadOrganization,signIn,signUp,updateProfile,signOut}
})