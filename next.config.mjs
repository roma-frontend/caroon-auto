/** @type {import('next').NextConfig} */
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const isDev = process.env.NODE_ENV === 'development';

// Content Security Policy
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // required for Next.js inline scripts
    "'unsafe-eval'",   // required for Next.js dev HMR
    'https://va.vercel-scripts.com',
    'https://vercel.live',
  ],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'blob:', 'https://*.r2.dev', 'https://*.r2.cloudflarestorage.com', 'https://lh3.googleusercontent.com'],
  'connect-src': [
    "'self'",
    'https://*.convex.cloud',
    'wss://*.convex.cloud',
    'https://va.vercel-scripts.com',
    isDev ? 'ws://localhost:*' : '',
  ].filter(Boolean),
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
};

const csp = Object.entries(cspDirectives)
  .map(([k, v]) => `${k} ${v.join(' ')}`.trim())
  .join('; ');

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ...(!isDev ? [{ key: 'Content-Security-Policy', value: csp }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'pub-*.r2.dev', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  compiler: {
    removeConsole: !isDev ? { exclude: ['error', 'warn'] } : false,
  },

  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-icons',
      'convex',
      'framer-motion',
      'sonner',
      'zustand',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      '@vercel/analytics',
      '@vercel/speed-insights',
    ],
  },

  async headers() {
    return [
      // Security headers on all routes
      { source: '/(.*)', headers: securityHeaders },
      // Static assets — long cache
      {
        source: '/:path*\\.{png,jpg,jpeg,gif,webp,avif,svg,ico,woff,woff2}',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Home page — ISR-friendly
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=3600, stale-while-revalidate=86400' }],
      },
      // API routes — no cache
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },

  async redirects() {
    return [
      // Redirect www to non-www (handled by Vercel, but good to have)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.caroon.am' }],
        destination: 'https://caroon.am/:path*',
        permanent: true,
      },
    ];
  },
};

export default withAnalyzer(nextConfig);
