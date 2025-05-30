// 📁 src/lib/auth/config.ts - Version corrigée
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb/connection'
import { UserModel } from '@/lib/mongodb/models'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Provider Google OAuth
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets',
        },
      },
    }),

    // Provider Email/Password
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()

        // ✅ CORRECTION 1: Typage correct pour credentials
        const user = await UserModel.findOne({ 
          email: (credentials.email as string).toLowerCase() 
        })

        if (!user || !(user as any).password) {
          return null
        }

        // ✅ CORRECTION 2: Typage correct pour password
        const isValid = await bcrypt.compare(
          credentials.password as string, 
          (user as any).password
        )
        
        if (!isValid) {
          return null
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          plan: user.plan,
        }
      },
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        await connectDB()

        // Vérifier si l'utilisateur existe déjà
        let existingUser = await UserModel.findOne({ 
          email: user.email?.toLowerCase() 
        })

        if (!existingUser) {
          // Créer nouvel utilisateur Google
          existingUser = await UserModel.create({
            email: user.email?.toLowerCase(),
            name: user.name || 'Utilisateur',
            plan: 'starter',
            googleId: account.providerAccountId,
          })
          console.log('✅ New Google user created:', existingUser.email)
        }

        // Stocker l'ID MongoDB pour la session
        user.id = existingUser._id.toString()
      }

      return true
    },

    async jwt({ token, user, account }) {
      // Stocker les infos utilisateur dans le JWT
      if (user) {
        token.id = user.id
        token.plan = (user as any).plan
      }

      // Stocker le token Google pour les API calls
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token
        token.googleRefreshToken = account.refresh_token
      }

      return token
    },

    async session({ session, token }) {
      // Passer les infos du JWT à la session
      if (token && session.user) {
        (session.user as any).id = token.id as string
        ;(session.user as any).plan = token.plan as string
        ;(session as any).googleAccessToken = token.googleAccessToken as string
      }

      return session
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === 'development',
})

// Helper pour créer un utilisateur avec mot de passe
export async function createUserWithPassword(
  email: string, 
  password: string, 
  name: string
) {
  await connectDB()

  // Vérifier si l'utilisateur existe
  const existing = await UserModel.findOne({ 
    email: email.toLowerCase() 
  })

  if (existing) {
    throw new Error('Cet email est déjà utilisé')
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 12)

  // Créer l'utilisateur
  const user = await UserModel.create({
    email: email.toLowerCase(),
    name,
    password: hashedPassword,
    plan: 'starter',
  })

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    plan: user.plan,
  }
}

// ✅ CORRECTION 3: Types corrects pour NextAuth v5
declare module 'next-auth' {
  interface User {
    id: string
    plan?: string
  }

  interface Session {
    user: {
      id: string
      email: string
      name: string
      plan: string
    }
    googleAccessToken?: string
  }
}