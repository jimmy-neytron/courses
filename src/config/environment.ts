export const environment = Object.freeze({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.trim() ?? '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim() ?? '',
})

export const isSupabaseConfigured = Boolean(
  environment.supabaseUrl && environment.supabaseAnonKey,
)
