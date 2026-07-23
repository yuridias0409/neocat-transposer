import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.jpg', 'new-icon-without-background.png'],
      manifest: {
        name: 'Tom do Salmista',
        short_name: 'Tom do Salmista',
        description: 'Transpositor e auxílio para salmistas',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'new-icon-without-background.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'new-icon-without-background.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'new-icon-without-background.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      'react/jsx-dev-runtime': path.resolve(__dirname, 'src/jsx-dev-polyfill.js'),
    }
  }
})
