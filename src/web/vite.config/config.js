import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, '../index.ts'),
      },
      output: {
        entryFileNames: 'index.js',
      },
    },
    outDir: 'media/web',
    sourcemap: false,
  },
})
