import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import {
  loadProfile,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword,
} from '@/services/auth/auth.service'
import type { AuthProfile } from '@/types/auth'
import { isSupabaseConfigured, supabase } from '@/services/supabase/client'

const LOCAL_PROFILE: AuthProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'local@courses.app',
  displayName: 'Локальный автор',
}

export const useAuthStore = defineStore('auth', () => {
  const initialized = ref(false)
  const loading = ref(false)
  const user = ref<User | null>(null)
  const profile = ref<AuthProfile | null>(null)

  const isConfigured = isSupabaseConfigured
  const isAuthenticated = computed(() => !isSupabaseConfigured || Boolean(user.value))
  const userId = computed(() => isSupabaseConfigured ? user.value?.id ?? '' : LOCAL_PROFILE.id)
  const displayName = computed(() => isSupabaseConfigured
    ? profile.value?.displayName || user.value?.email || 'Автор'
    : LOCAL_PROFILE.displayName)

  async function refreshProfile(): Promise<void> {
    profile.value = user.value ? await loadProfile(user.value) : null
  }

  async function applySession(session: Session | null): Promise<void> {
    user.value = session?.user ?? null
    await refreshProfile()
  }

  async function initialize(): Promise<void> {
    if (initialized.value) return

    if (!supabase) {
      profile.value = LOCAL_PROFILE
      initialized.value = true
      return
    }

    const { data, error } = await supabase.auth.getSession()
    if (error) throw new Error(error.message)

    await applySession(data.session)
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      void applySession(session)
    })
    initialized.value = true
  }

  async function signIn(email: string, password: string): Promise<void> {
    loading.value = true
    try {
      await signInWithPassword(email, password)
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, name: string): Promise<void> {
    loading.value = true
    try {
      await signUpWithPassword(email, password, name)
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    await signOutCurrentUser()
  }

  return {
    initialized,
    loading,
    user,
    profile,
    isConfigured,
    isAuthenticated,
    userId,
    displayName,
    initialize,
    refreshProfile,
    signIn,
    signUp,
    signOut,
  }
})
