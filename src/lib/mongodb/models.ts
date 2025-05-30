import mongoose, { Schema, Document } from 'mongoose'

interface IUser extends Document {
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
}

interface IIntegration extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  source: {
    type: "stripe" | "mailchimp" | "hubspot" | "google-forms"
    config: Record<string, any>
    credentials: string
  }
  destination: {
    type: "google-sheets" | "hubspot" | "mailchimp" | "webhook"
    config: Record<string, any>
    credentials: string
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
}

interface ISyncLog extends Document {
  integrationId: mongoose.Types.ObjectId
  status: "success" | "error" | "warning"
  stats: {
    recordsProcessed: number
    recordsCreated: number
    recordsUpdated: number
    recordsSkipped: number
    duration?: number
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
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  plan: {
    type: String,
    enum: ['starter', 'business', 'enterprise'],
    default: 'starter',
  },
  googleId: String,
  stripeCustomerId: String,
  subscriptionId: String,
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'canceled'],
    default: 'inactive',
  },
  usage: {
    integrationsCount: { type: Number, default: 0 },
    syncsThisMonth: { type: Number, default: 0 },
    lastSync: Date,
  },
}, {
  timestamps: true,
})

const IntegrationSchema = new Schema<IIntegration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: {
      type: String,
      required: true,
      enum: ['stripe', 'mailchimp', 'hubspot', 'google-forms'],
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    credentials: {
      type: String,
      required: true,
    },
  },
  destination: {
    type: {
      type: String,
      required: true,
      enum: ['google-sheets', 'hubspot', 'mailchimp', 'webhook'],
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
    credentials: {
      type: String,
      required: true,
    },
  },
  mapping: [{
    from: { type: String, required: true },
    to: { type: String, required: true },
    transform: {
      type: String,
      enum: ['none', 'uppercase', 'lowercase', 'date', 'currency'],
      default: 'none',
    },
  }],
  syncConfig: {
    frequency: {
      type: String,
      enum: ['manual', 'real-time', 'hourly', 'daily'],
      default: 'manual',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSync: Date,
    nextSync: Date,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'error', 'setup'],
    default: 'setup',
  },
  lastError: {
    message: String,
    code: String,
    timestamp: Date,
  },
}, {
  timestamps: true,
})

const SyncLogSchema = new Schema<ISyncLog>({
  integrationId: {
    type: Schema.Types.ObjectId,
    ref: 'Integration',
    required: true,
  },
  status: {
    type: String,
    enum: ['success', 'error', 'warning'],
    required: true,
  },
  stats: {
    recordsProcessed: { type: Number, default: 0 },
    recordsCreated: { type: Number, default: 0 },
    recordsUpdated: { type: Number, default: 0 },
    recordsSkipped: { type: Number, default: 0 },
    duration: Number,
  },
  error: {
    message: String,
    code: String,
    stack: String,
  },
  metadata: {
    triggerType: {
      type: String,
      enum: ['manual', 'scheduled', 'webhook'],
      default: 'manual',
    },
    sourceVersion: String,
    dataSnapshot: Schema.Types.Mixed,
  },
}, {
  timestamps: true,
})

UserSchema.index({ email: 1 })
UserSchema.index({ stripeCustomerId: 1 })
IntegrationSchema.index({ userId: 1, status: 1 })
IntegrationSchema.index({ 'syncConfig.nextSync': 1, status: 1 })
IntegrationSchema.index({ userId: 1, 'source.type': 1, 'destination.type': 1 })
SyncLogSchema.index({ integrationId: 1, createdAt: -1 })
SyncLogSchema.index({ status: 1, createdAt: -1 })
SyncLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 })

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
export const IntegrationModel = mongoose.models.Integration || mongoose.model<IIntegration>('Integration', IntegrationSchema)
export const SyncLogModel = mongoose.models.SyncLog || mongoose.model<ISyncLog>('SyncLog', SyncLogSchema)

export async function initializeDatabase() {
  try {
    await UserModel.ensureIndexes()
    await IntegrationModel.ensureIndexes()
    await SyncLogModel.ensureIndexes()
    console.log('✅ Database indexes created')
  } catch (error) {
    console.error('❌ Error creating database indexes:', error)
  }
}

export async function getDbStats() {
  const stats = {
    users: await UserModel.countDocuments(),
    integrations: await IntegrationModel.countDocuments(),
    activeIntegrations: await IntegrationModel.countDocuments({ status: 'active' }),
    syncsToday: await SyncLogModel.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    }),
  }
  return stats
}
