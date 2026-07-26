import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTransientFlag } from '@/composables/useTransientFlag'
import { useNotificationStore } from '@/stores/notifications'

const heading = { title: 'Настройки', description: 'Профиль и рабочее пространство.' }

export function useSettingsPage() {
  const auth = useAuthStore()
  const notifications = useNotificationStore()
  const profileName = ref('')
  const { value: saved, show: showSaved } = useTransientFlag()

  watch(() => auth.user, () => {
    profileName.value = String(auth.user?.user_metadata?.display_name ?? '')
  }, { immediate: true })

  async function saveProfile() {
    try {
      await auth.updateProfile(profileName.value)
      showSaved()
      notifications.success('Профиль сохранён')
    } catch (error) {
      notifications.error(error instanceof Error ? error.message : 'Не удалось сохранить профиль')
    }
  }

  return { auth, heading, profileName, saved, saveProfile }
}