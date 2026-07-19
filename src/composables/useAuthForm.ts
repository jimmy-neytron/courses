import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

type AuthMode = 'login' | 'register'

export function useAuthForm() {
  const store = useAuthStore()
  const router = useRouter()
  const route = useRoute()
  const mode = ref<AuthMode>(route.query.mode === 'register' ? 'register' : 'login')
  const name = ref('')
  const email = ref('')
  const password = ref('')
  const busy = ref(false)
  const error = ref('')
  const notice = ref('')

  const isLogin = computed(() => mode.value === 'login')

  function resetMessages(): void {
    error.value = ''
    notice.value = ''
  }

  async function submit(): Promise<void> {
    resetMessages()
    busy.value = true

    try {
      if (isLogin.value) {
        await store.signIn(email.value, password.value)
        await router.replace(String(route.query.redirect ?? '/app'))
        return
      }

      const active = await store.signUp(email.value, password.value, name.value)
      if (active) await router.replace('/app')
      else notice.value = 'Проверьте почту и подтвердите регистрацию, затем войдите.'
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Не удалось выполнить запрос'
    } finally {
      busy.value = false
    }
  }

  function switchMode(): void {
    mode.value = isLogin.value ? 'register' : 'login'
    resetMessages()
  }

  return { mode, isLogin, name, email, password, busy, error, notice, submit, switchMode }
}
