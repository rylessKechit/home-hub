// Types globaux pour Integration Hub PME

export interface User {
  _id: string
  email: string
  name: string
  plan: "starter" | "business" | "enterprise"
  googleId?: string
  stripeCustomerId?: string
  subscriptionId?: string
  subscriptionStatus?: "active" | "inactive" | "canceled"
  usage: {
    integrationsCount: number
    syncsThisMonth: number
    lastSync?: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface Integration {
  _id: string
  userId: string
  name: string
  source: {
    type: "stripe" | "mailchimp" | "hubspot" | "google-forms"
    config: Record<string, any>
    credentials: string // Chiffré
  }
  destination: {
    type: "google-sheets" | "hubspot" | "mailchimp" | "webhook"
    config: Record<string, any>
    credentials: string // Chiffré
  }
  mapping: Array<{
    from: string
    to: string
    transform: "none" | "uppercase" | "lowercase" | "date" | "currency"
  }>
  syncConfig: {
    frequency: "manual" | "real-time" | "hourly" | "daily"
    enabled: boolean
    lastSync?: Date
    nextSync?: Date
  }
  status: "active" | "paused" | "error" | "setup"
  lastError?: {
    message: string
    code: string
    timestamp: Date
  }
  createdAt: Date
  updatedAt: Date
}

export interface SyncLog {
  _id: string
  integrationId: string
  status: "success" | "error" | "warning"
  stats: {
    recordsProcessed: number
    recordsCreated: number
    recordsUpdated: number
    recordsSkipped: number
    duration?: number // en millisecondes
  }
  error?: {
    message: string
    code: string
    stack?: string
  }
  metadata: {
    triggerType: "manual" | "scheduled" | "webhook"
    sourceVersion?: string
    dataSnapshot?: any
  }
  createdAt: Date
}

export interface ConnectorConfig {
  [key: string]: any
}

export interface BaseConnector {
  auth(credentials: string): Promise<boolean>
  fetch(config: ConnectorConfig): Promise<any[]>
  push?(data: any[], config: ConnectorConfig): Promise<void>
}

export interface EncryptedCredentials {
  encrypted: string
  iv: string
  authTag: string
}

// Types pour les limites de plan
export interface PlanLimits {
  integrations: number // -1 = illimité
  syncsPerMonth: number // -1 = illimité
  webhooks: boolean
  advancedFeatures: boolean
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
