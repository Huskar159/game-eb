/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Garante que as variáveis de ambiente estejam disponíveis no lado do servidor
  env: {
    MERCADOPAGO_ACCESS_TOKEN: process.env.MERCADOPAGO_ACCESS_TOKEN,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  // Configurações adicionais para facilitar o diagnóstico
  serverRuntimeConfig: {
    // Será apenas disponível no lado do servidor
    mercadoPagoToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  },
  publicRuntimeConfig: {
    // Será disponível tanto no servidor quanto no cliente
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV || 'development',
    vercelUrl: process.env.VERCEL_URL || 'http://localhost:3000',
  },
  // Habilitar logs de build detalhados
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  // Configurações adicionais de compilação
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@mercadopago/sdk-node'],
  },
}

// Log das configurações no momento do build (apenas em desenvolvimento)
if (process.env.NODE_ENV !== 'production') {
  console.log('=== CONFIGURAÇÕES NEXT.CONFIG.MJS ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
  console.log('VERCEL_URL:', process.env.VERCEL_URL);
  console.log('MERCADOPAGO_ACCESS_TOKEN:', 
    process.env.MERCADOPAGO_ACCESS_TOKEN ? '***' + process.env.MERCADOPAGO_ACCESS_TOKEN.slice(-4) : 'NÃO DEFINIDO');
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
  console.log('==================================');
}

export default nextConfig