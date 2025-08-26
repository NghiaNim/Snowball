import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Minimal configuration for Turbopack compatibility
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

export default nextConfig