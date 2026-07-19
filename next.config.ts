import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
