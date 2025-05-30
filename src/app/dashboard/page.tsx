// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import connectDB from '@/lib/mongodb/connection'
import { UserModel } from '@/lib/mongodb/models'

export default async function DashboardPage() {
  // Vérifier l'authentification
  const session = await getServerSession(authConfig)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Récupérer l'utilisateur depuis la DB
  await connectDB()
  const user = await UserModel.findById(session.user.id)

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.plan})
              </span>
              <a
                href="/api/auth/signout"
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Déconnexion
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Statistiques utilisateur */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">📊</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Intégrations
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.usage?.integrationsCount || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">⚡</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Syncs ce mois
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {user.usage?.syncsThisMonth || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">👤</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Plan actuel
                      </dt>
                      <dd className="text-lg font-medium text-gray-900 capitalize">
                        {user.plan}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Actions rapides
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-xl mb-2">🔗</div>
                    <div className="font-medium text-gray-900">Nouvelle intégration</div>
                    <div className="text-sm text-gray-500">Connecter vos outils</div>
                  </button>
                  
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-xl mb-2">📊</div>
                    <div className="font-medium text-gray-900">Voir les stats</div>
                    <div className="text-sm text-gray-500">Analytics détaillées</div>
                  </button>
                  
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-xl mb-2">⚙️</div>
                    <div className="font-medium text-gray-900">Paramètres</div>
                    <div className="text-sm text-gray-500">Configuration compte</div>
                  </button>
                  
                  <button className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-left">
                    <div className="text-xl mb-2">💬</div>
                    <div className="font-medium text-gray-900">Support</div>
                    <div className="text-sm text-gray-500">Aide & documentation</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Chapitre 2 complété !
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Database & Auth configurés avec succès.</p>
                  <p className="mt-1">
                    <strong>Prochaine étape :</strong> Chapitre 3 - Premier Connecteur (Stripe)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
