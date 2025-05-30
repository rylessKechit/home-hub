// 📁 next.config.js (Mise à jour pour éviter l'erreur de route typée)
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    typedRoutes: false, // ✅ Désactivé pour éviter les erreurs de type
  },
}

module.exports = nextConfig