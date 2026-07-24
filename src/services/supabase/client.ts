import { createClient } from '@supabase/supabase-js'

import { environment, isSupabaseConfigured } from '@/config/environment'

export { isSupabaseConfigured }

export const supabase = isSupabaseConfigured
  ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
