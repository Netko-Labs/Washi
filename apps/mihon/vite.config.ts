import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // One React: workspace packages resolve their own copy under the isolated linker.
  resolve: { alias: { '@': `${dirname}src` }, dedupe: ['react', 'react-dom'] },
  server: { port: Number(process.env.PORT ?? 3200) },
})
