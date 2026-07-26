import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'

type AuthMode = 'login' | 'register'

export function useAuthForm() {
  const store = useAuthStore()
  const notifications = useNotificationStore()
  const router = useRouter()
  const route = useRoute()
  const mode = ref<AuthMode>(route.query.mode === 'register' ? 'register' : 'login')
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const busy = ref(false)

  const isLogin = computed(() => mode.value === 'login')

  async function submit(): Promise<void> {
    busy.value = true

    try {
      if (isLogin.value) {
        await store.signIn(email.value, password.value)
        await router.replace(String(route.query.redirect ?? '/app'))
        return
      }

      const active = await store.signUp(email.value, password.value, name.value)
      if (active) await router.replace('/app')
      else notifications.info('Проверьте почту и подтвердите регистрацию, затем войдите.')
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось выполнить запрос'
      notifications.error(
        message.includes('row-level security')
          ? 'Не удалось создать профиль. Примените актуальную RLS-миграцию и попробуйте снова.'
          : message,
      )
    } finally {
      busy.value = false
    }
  }

  function switchMode(): void {
    mode.value = isLogin.value ? 'register' : 'login'
  }

  return { mode, isLogin, name, email, password, busy, submit, switchMode }
}
