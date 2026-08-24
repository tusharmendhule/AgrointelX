import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Where the backend API server runs in development.
  const backendTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:3001';

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'AgroIntelX - AI Agriculture Platform',
          short_name: 'AgroIntelX',
          description: 'AI-powered agriculture intelligence platform for farmers',
          theme_color: '#16a34a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          categories: ['agriculture', 'weather', 'productivity'],
          icons: [
            {
              src: 'icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: 'icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: 'icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: 'icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: 'icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: 'icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: 'icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\.googleapis\.com\/.*$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            {
              urlPattern: /^https:\/\/.*\.gstatic\.com\/.*$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // Proxy API calls to the standalone backend server during local development,
      // so the frontend code can keep using relative "/api/..." paths.
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
