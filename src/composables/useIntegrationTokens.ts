import { computed, onMounted, ref } from 'vue'
import {
  createIntegrationToken,
  listIntegrationTokens,
  revokeIntegrationToken,
} from '@/services/integration-token.service'
import type { IntegrationToken } from '@/types/integration-token'

export function useIntegrationTokens() {
  const tokens = ref<IntegrationToken[]>([])
  const generatedToken = ref('')
  const loading = ref(false)
  const creating = ref(false)
  const revokingId = ref('')
  const error = ref('')

  const activeTokens = computed(() => tokens.value.filter(
    (token) => !token.revokedAt,
  ))

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      tokens.value = await listIntegrationTokens()
    } catch (caught) {
      error.value = caught instanceof Error
        ? caught.message
        : 'Не удалось загрузить токены'
    } finally {
      loading.value = false
    }
  }

  async function create(name: string): Promise<boolean> {
    creating.value = true
    error.value = ''
    try {
      const created = await createIntegrationToken(name)
      generatedToken.value = created.token
      tokens.value.unshift(created.metadata)
      return true
    } catch (caught) {
      error.value = caught instanceof Error
        ? caught.message
        : 'Не удалось создать токен'
      return false
    } finally {
      creating.value = false
    }
  }

  async function revoke(tokenId: string): Promise<boolean> {
    revokingId.value = tokenId
    error.value = ''
    try {
      await revokeIntegrationToken(tokenId)
      const token = tokens.value.find(
        (item) => item.id === tokenId,
      )
      if (token) token.revokedAt = new Date().toISOString()
      return true
    } catch (caught) {
      error.value = caught instanceof Error
        ? caught.message
        : 'Не удалось отозвать токен'
      return false
    } finally {
      revokingId.value = ''
    }
  }

  function dismissGeneratedToken(): void {
    generatedToken.value = ''
  }

  onMounted(load)

  return {
    tokens,
    activeTokens,
    generatedToken,
    loading,
    creating,
    revokingId,
    error,
    load,
    create,
    revoke,
    dismissGeneratedToken,
  }
}
