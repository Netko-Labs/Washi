import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'content-security-policy': "frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
}

// Read their own files at runtime (loro's .wasm, the Agent SDK's native claude binary), so they
// ship as real packages under .output/server/node_modules instead of being inlined.
// A page's libraries are bundled per page at runtime (D100), read off disk by Bun.build.
const RUNTIME_FILE_DEPS = [
  'loro-crdt',
  '@anthropic-ai/claude-agent-sdk',
  'date-fns',
  'lodash-es',
  'zod',
]
// React for a widget's frame (D113), bundled at runtime off disk like a page's libraries.
const WIDGET_FILE_DEPS = ['react', 'react-dom', 'scheduler']

// Built servers only: HSTS on a dev https *.localhost would pin every local project for a year.
const HSTS_HEADER = { 'strict-transport-security': 'max-age=31536000; includeSubDomains' }

export default defineConfig(({ command }) => ({
  server: { port: Number(process.env.PORT ?? 3000) },
  // One React: workspace packages resolve their own copy under the isolated linker.
  resolve: { tsconfigPaths: true, dedupe: ['react', 'react-dom'] },
  // Packages that read their own files at runtime stay real packages; nitro's traceDeps ships them.
  ssr: { external: RUNTIME_FILE_DEPS },
  // The scan crawls server routes too; an unresolvable `bun` import aborts it, and every client
  // dep is then found late, one full reload at a time.
  optimizeDeps: { rolldownOptions: { external: [/^bun(:|$)/] } },
  build: {
    rolldownOptions: {
      // Bun's own modules (SQL, SQLite) exist only at runtime on Bun.
      external: [/^bun(:|$)/],
      // Every React library ships 'use client'; the warning is noise for an SSR bundle.
      onLog(level, log, handler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
        handler(level, log)
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro({
      preset: 'bun',
      traceDeps: [...RUNTIME_FILE_DEPS, ...WIDGET_FILE_DEPS].map((name) => `${name}*`),
      experimental: { websocket: true },
      handlers: [
        { route: '/trpc-ws', handler: './src/server/trpc-ws.ts' },
        { route: '/.well-known/**', handler: './src/server/well-known.ts' },
      ],
      plugins: ['./src/server/plugins/runtime.ts', './src/server/plugins/asset-misses.ts'],
      routeRules: {
        '/**': {
          headers: command === 'build' ? { ...SECURITY_HEADERS, ...HSTS_HEADER } : SECURITY_HEADERS,
        },
      },
    }),
    viteReact(),
  ],
}))
