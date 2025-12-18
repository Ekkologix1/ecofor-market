import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Configuraciones de rendimiento y optimización
  reactStrictMode: true,
  
  // Permitir orígenes en desarrollo (para acceso desde otros dispositivos en la red local)
  allowedDevOrigins: process.env.NODE_ENV === 'development' 
    ? ['192.168.1.29', 'localhost'] 
    : undefined,
  
  // Configuraciones experimentales para mejor rendimiento
  experimental: {
    // optimizeCss: true, // Desactivado temporalmente por error de critters
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Configuración de Turbopack (nueva sintaxis)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Configuración para imágenes optimizada
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 año
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 75, 90, 100], // Configuración requerida para Next.js 16
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },
  
  // Configuración para compilación más rápida
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración para desarrollo más rápido
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  }),
  
  // Configuración para manejar módulos de Node.js en el cliente
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      // Excluir módulos de Node.js del bundle del cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    // Optimizaciones para desarrollo
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  },
}

export default nextConfig