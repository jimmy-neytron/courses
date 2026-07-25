import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransientFlag } from '@/composables/useTransientFlag'

const heading = { title: 'Настройки', description: 'Профиль и рабочее пространство.' }

export function useSettingsPage() {
  const auth = useAuthStore()
  const profileName = ref('')
  const { value: saved, show: showSaved } = useTransientFlag()

  watch(() => auth.user, () => {
    profileName.value = String(auth.user?.user_metadata?.display_name ?? '')
  }, { immediate: true })

  async function saveProfile() {
    await auth.updateProfile(profileName.value)
    showSaved()
  }

  return { auth, heading, profileName, saved, saveProfile }
}