'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push('/dashboard' as any)
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/dashboard'
      })
      
      if (result?.error) {
        setError('Erreur de connexion avec Google')
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            🔗 Integration Hub PME
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Connectez vos outils business sans effort
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </>
              )}
            </button>

            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-medium text-gray-900">
                Pourquoi Integration Hub PME ?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Interface 100% française
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Conformité RGPD native
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Prix adapté aux PME
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Support client français
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            En vous connectant, vous acceptez nos{' '}
            <a href="#" className="text-blue-600 hover:underline">
              conditions d'utilisation
            </a>{' '}
            et notre{' '}
            <a href="#" className="text-blue-600 hover:underline">
              politique de confidentialité
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
