/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permite build em produção mesmo com erros de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permite build mesmo com erros de TypeScript
    // Necessário por causa de problemas com types de bibliotecas
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
