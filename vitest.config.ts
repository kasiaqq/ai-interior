import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const alias = {
  '#shared': fileURLToPath(new URL('./shared', import.meta.url)),
  '~': fileURLToPath(new URL('./app', import.meta.url)),
}

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        resolve: { alias },
        test: {
          name: 'unit',
          environment: 'happy-dom',
          include: ['test/{app,server,shared}/**/*.test.ts'],
        },
      },
      {
        // Builds the app and calls the real API routes over HTTP, with Cloudflare stood in locally.
        test: {
          name: 'routes',
          environment: 'node',
          include: ['test/routes/**/*.test.ts'],
          testTimeout: 30_000,
          hookTimeout: 180_000,
        },
      },
    ],
  },
})
