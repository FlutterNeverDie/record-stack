import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 네트워크 상의 다른 기기에서도 접속 가능하게 설정
  }
})
