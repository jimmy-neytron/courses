export interface IntegrationToken {
  id: string
  name: string
  prefix: string
  scopes: string[]
  lastUsedAt?: string
  expiresAt?: string
  revokedAt?: string
  createdAt: string
}

export interface CreatedIntegrationToken {
  token: string
  metadata: IntegrationToken
}
