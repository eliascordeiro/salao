/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
  // Configuração especial para WPPConnect (usa módulos problemáticos)
  webpack: (config, { isServer }) => {
    // Desabilita warnings de require() dinâmico
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    
    // WPPConnect só funciona no servidor
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http: false,
        https: false,
        stream: false,
        zlib: false,
        crypto: false,
      };
    }
    
    // Ignora avisos de módulos específicos
    config.ignoreWarnings = [
      { module: /node_modules\/clone-deep/ },
      { module: /node_modules\/puppeteer/ },
      { module: /node_modules\/@wppconnect-team/ },
    ];
    
    return config;
  },
  // Experimentally support server components
  experimental: {
    serverComponentsExternalPackages: ['@wppconnect-team/wppconnect', 'puppeteer', 'puppeteer-core'],
  },
};

module.exports = nextConfig;
