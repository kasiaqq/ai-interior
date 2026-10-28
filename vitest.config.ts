import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
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
      // Pages and app-level components, mounted inside a real Nuxt app (router, Pinia, auto-imports).
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['test/nuxt/**/*.test.ts'],
          environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
        },
      }),
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
