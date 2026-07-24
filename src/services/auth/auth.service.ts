import type { User } from '@supabase/supabase-js'

import { supabase } from '@/services/supabase/client'
import type { AuthProfile } from '@/types/auth'

export async function loadProfile(user: User): Promise<AuthProfile> {
  if (!supabase) return createFallbackProfile(user)

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,display_name')
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return createFallbackProfile(user)

  return {
    id: String(data.id),
    email: String(data.email ?? user.email ?? ''),
    displayName: String(data.display_name ?? ''),
  }
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName.trim() } },
  })
  if (error) throw new Error(error.message)
}

export async function signOutCurrentUser(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

function createFallbackProfile(user: User): AuthProfile {
  return {
    id: user.id,
    email: user.email ?? '',
    displayName: '',
  }
}
