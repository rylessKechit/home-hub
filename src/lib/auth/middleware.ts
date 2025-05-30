// 📁 src/lib/auth/middleware.ts
import { auth } from './config'
import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb/connection'
import { UserModel } from '@/lib/mongodb/models'

export async function withAuth(
  handler: (req: NextRequest, user: any) => Promise<Response>,
  options: { requirePlan?: string[] } = {}
) {
  return async (req: NextRequest) => {
    try {
      const session = await auth()
      
      if (!session?.user || !(session.user as any).id) {
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        )
      }

      await connectDB()
      const user = await UserModel.findById((session.user as any).id)
      
      if (!user) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }

      if (options.requirePlan && !options.requirePlan.includes(user.plan)) {
        return NextResponse.json(
          { 
            error: 'Plan insuffisant',
            required: options.requirePlan,
            current: user.plan 
          },
          { status: 403 }
        )
      }

      return await handler(req, user)
      
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      )
    }
  }
}

export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user || !(session.user as any).id) {
    return null
  }

  await connectDB()
  const user = await UserModel.findById((session.user as any).id)
  
  return user
}

export function checkPlanLimits(user: any, action: string) {
  const limits = {
    starter: { integrations: 3, syncsPerMonth: 1000 },
    business: { integrations: 10, syncsPerMonth: 10000 },
    enterprise: { integrations: -1, syncsPerMonth: -1 },
  }

  const userLimits = limits[user.plan as keyof typeof limits]
  
  if (!userLimits) {
    return { allowed: false, reason: 'Plan invalide' }
  }

  switch (action) {
    case 'create_integration':
      if (userLimits.integrations !== -1 && user.usage.integrationsCount >= userLimits.integrations) {
        return { 
          allowed: false, 
          reason: `Limite de ${userLimits.integrations} intégrations atteinte`,
          upgrade: true 
        }
      }
      break
      
    case 'sync':
      if (userLimits.syncsPerMonth !== -1 && user.usage.syncsThisMonth >= userLimits.syncsPerMonth) {
        return { 
          allowed: false, 
          reason: `Limite de ${userLimits.syncsPerMonth} syncs/mois atteinte`,
          upgrade: true 
        }
      }
      break
  }

  return { allowed: true }
}

const userRateLimit = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(userId: string, maxRequests = 60, windowMs = 60000) {
  const now = Date.now()
  const userLimit = userRateLimit.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    userRateLimit.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (userLimit.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: userLimit.resetTime 
    }
  }

  userLimit.count++
  return { 
    allowed: true, 
    remaining: maxRequests - userLimit.count 
  }
}