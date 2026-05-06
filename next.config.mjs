/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configuración experimental para mejorar compatibilidad
  experimental: {
    // Forzar webpack en desarrollo para evitar problemas con Turbopack
    forceSwcTransforms: true,
  },
  // Configuración del servidor webpack
  webpack: (config, { isServer }) => {
    // Configuración adicional si es necesario
    return config;
  },
}

export default nextConfig
