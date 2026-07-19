import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useClipboard } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { useTransientFlag } from '@/composables/useTransientFlag'

const pageCopy = {
  integrations: { title: 'Интеграции', description: 'Безопасное подключение внешних приложений.' },
  settings: { title: 'Настройки', description: 'Профиль и рабочее пространство.' },
} as const

export function useWorkspaceSettings() {
  const route = useRoute()
  const auth = useAuthStore()
  const section = computed(() => String(route.params.section) === 'integrations' ? 'integrations' : 'settings')
  const heading = computed(() => pageCopy[section.value])
  const profileName = ref('')
  const endpoint = computed(() => `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`)
  const { copy: copyEndpoint, copied } = useClipboard({ source: endpoint, copiedDuring: 1300 })
  const { value: saved, show: showSaved } = useTransientFlag()

  watch(() => auth.user, () => {
    profileName.value = String(auth.user?.user_metadata?.display_name ?? '')
  }, { immediate: true })

  async function saveProfile() {
    await auth.updateProfile(profileName.value)
    showSaved()
  }

  return { auth, section, heading, profileName, endpoint, copied, copyEndpoint, saved, saveProfile }
}
