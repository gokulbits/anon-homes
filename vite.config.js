import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        blog: resolve(import.meta.dirname, 'blog-budget-homes-kerala/index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
})
