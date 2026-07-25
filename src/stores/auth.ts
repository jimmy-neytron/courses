import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/services/supabase'

export interface OrganizationContext {
  /**
   * Compatibility identifier used by the UI from commit 5d40d0c.
   * The current database no longer has organizations, therefore the
   * authenticated user id represents a personal workspace.
   */
  id: string
  name: string
  role: string
}

interface ProfileRow {
  display_name?: string | null
  email?: string | null
}

function profileName(user: User, profile?: ProfileRow | null): string {
  const metadataName = typeof user.user_metadata?.display_name === 'string'
    ? user.user_metadata.display_name.trim()
    : ''

  return profile?.display_name?.trim()
    || metadataName
    || user.email?.trim()
    || 'Личное пространство'
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<Session | null>(null)
  const user = ref<User | null>(null)
  const organization = ref<OrganizationContext | null>(null)
  const loading = ref(true)
  const initializationError = ref('')
  let initialized = false

  const isAuthenticated = computed(() => Boolean(session.value))

  async function ensureProfile(activeUser: User): Promise<ProfileRow | null> {
    if (!supabase) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name,email')
      .eq('id', activeUser.id)
      .maybeSingle()

    if (error) throw error
    if (data) return data as ProfileRow

    const displayName = typeof activeUser.user_metadata?.display_name === 'string'
      ? activeUser.user_metadata.display_name.trim()
      : ''

    const { data: createdProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: activeUser.id,
        email: activeUser.email ?? null,
        display_name: displayName || activeUser.email || 'Пользователь',
      })
      .select('display_name,email')
      .single()

    if (createError) {
      throw new Error(
        `Не удалось создать профиль пользователя. Проверьте RLS для public.profiles: ${createError.message}`,
      )
    }

    return createdProfile as ProfileRow
  }

  /**
   * The old UI expects auth.organization to exist. The cleaned database has no
   * organization tables, so we expose a personal workspace backed by profiles.
   */
  async function loadOrganization(): Promise<void> {
    if (!supabase || !user.value) {
      organization.value = null
      return
    }

    const profile = await ensureProfile(user.value)
    organization.value = {
      id: user.value.id,
      name: profileName(user.value, profile),
      role: 'owner',
    }
  }

  async function initialize(): Promise<void> {
    if (initialized) return

    if (!supabase) {
      initialized = true
      loading.value = false
      return
    }

    initializationError.value = ''

    try {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error

      session.value = data.session
      user.value = data.session?.user ?? null

      supabase.auth.onAuthStateChange((_event, nextSession) => {
        session.value = nextSession
        user.value = nextSession?.user ?? null

        if (nextSession) {
          setTimeout(() => {
            void loadOrganization().catch((error: unknown) => {
              initializationError.value = error instanceof Error
                ? error.message
                : 'Не удалось подготовить личное пространство'
            })
          }, 0)
        } else {
          organization.value = null
        }
      })

      if (user.value) await loadOrganization()
    } catch (error) {
      session.value = null
      user.value = null
      organization.value = null
      initializationError.value = error instanceof Error
        ? error.message
        : 'Не удалось инициализировать авторизацию'
    } finally {
      initialized = true
      loading.value = false
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    if (!supabase) throw new Error('Supabase не настроен')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email: string, password: string, displayName: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase не настроен')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (error) throw error

    if (data.session?.user) {
      session.value = data.session
      user.value = data.session.user
      await loadOrganization()
    }

    return Boolean(data.session)
  }

  async function updateProfile(displayName: string): Promise<void> {
    if (!supabase || !user.value) return

    const normalizedName = displayName.trim()
    const { error } = await supabase.auth.updateUser({
      data: { display_name: normalizedName },
    })
    if (error) throw error

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.value.id,
        email: user.value.email ?? null,
        display_name: normalizedName,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })

    if (profileError) throw profileError

    const { data } = await supabase.auth.getUser()
    user.value = data.user
    await loadOrganization()
  }

  async function signOut(): Promise<void> {
    await supabase?.auth.signOut()
    session.value = null
    user.value = null
    organization.value = null
  }

  return {
    session,
    user,
    organization,
    loading,
    initializationError,
    isConfigured: isSupabaseConfigured,
    isAuthenticated,
    initialize,
    loadOrganization,
    signIn,
    signUp,
    updateProfile,
    signOut,
  }
})
