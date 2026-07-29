import { requireSupabase } from '@/services/supabase'
import type {
  CreatedIntegrationToken,
  IntegrationToken,
} from '@/types/integration-token'

interface TokenRow {
  id: string
  name: string
  token_prefix: string
  scopes: string[]
  last_used_at?: string | null
  expires_at?: string | null
  revoked_at?: string | null
  created_at: string
}

interface IntegrationFunctionError {
  error?: {
    message?: string
  }
}

interface TokenListResponse {
  tokens?: TokenRow[]
}

interface TokenCreateResponse {
  token?: string
  metadata?: TokenRow
}

function mapToken(row: TokenRow): IntegrationToken {
  return {
    id: row.id,
    name: row.name,
    prefix: row.token_prefix,
    scopes: row.scopes,
    lastUsedAt: row.last_used_at ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    revokedAt: row.revoked_at ?? undefined,
    createdAt: row.created_at,
  }
}

async function functionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (
    error
    && typeof error === 'object'
    && 'context' in error
    && error.context instanceof Response
  ) {
    try {
      const body = await error.context
        .clone()
        .json() as IntegrationFunctionError
      if (body.error?.message) return body.error.message
    } catch {
      // The generic SDK message below is still safe to show.
    }
  }

  return error instanceof Error && error.message
    ? error.message
    : fallback
}

async function invoke<T>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await requireSupabase().functions.invoke<T>(
    'courses-integration',
    {
      body: {
        action,
        payload,
      },
    },
  )

  if (error) {
    throw new Error(
      await functionErrorMessage(
        error,
        'Не удалось выполнить запрос к интеграции',
      ),
    )
  }

  if (!data) {
    throw new Error('Сервер не вернул данные')
  }

  return data
}

export async function listIntegrationTokens(): Promise<IntegrationToken[]> {
  const data = await invoke<TokenListResponse>('list-tokens')
  return (data.tokens ?? []).map(mapToken)
}

export async function createIntegrationToken(
  name: string,
): Promise<CreatedIntegrationToken> {
  const data = await invoke<TokenCreateResponse>(
    'create-token',
    { name },
  )

  if (!data.token || !data.metadata) {
    throw new Error('Сервер не вернул созданный токен')
  }

  return {
    token: data.token,
    metadata: mapToken(data.metadata),
  }
}

export async function revokeIntegrationToken(
  tokenId: string,
): Promise<void> {
  await invoke<{ revoked: boolean }>(
    'revoke-token',
    { tokenId },
  )
}
