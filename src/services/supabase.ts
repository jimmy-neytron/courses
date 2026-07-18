import { createClient, type SupabaseClient } from '@supabase/supabase-js'
const url=import.meta.env.VITE_SUPABASE_URL?.trim()
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
export const isSupabaseConfigured=Boolean(url&&key)
export const supabase:SupabaseClient|null=isSupabaseConfigured?createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null
export function requireSupabase():SupabaseClient{if(!supabase)throw new Error('Supabase не настроен. Заполните VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY в .env');return supabase}