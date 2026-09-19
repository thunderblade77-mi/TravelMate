import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'travelg-icon.jpg'],
      manifest: {
        name: 'TravelG',
        short_name: 'TravelG',
        description:
          'Il tuo viaggio, tutto in un posto',
        theme_color: '#0284c7',
        background_color: '#f8fafc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'travelg-icon.jpg',
            sizes: '256x256',
            type: 'image/jpeg',
            purpose: 'any',
          },
          {
            src: 'travelg-icon.jpg',
            sizes: '256x256',
            type: 'image/jpeg',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}',
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})