import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '하방 점검 보고서',
        short_name: '점검보고서',
        description: '아파트/시설물 점검 보고서 자동 생성 앱',
        theme_color: '#ffffff'
      }
    })
  ],
})



