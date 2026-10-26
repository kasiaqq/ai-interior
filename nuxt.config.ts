// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/fonts'],
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  // Image (~10 s) plus description (~8 s) outlast Vercel's default function timeout.
  nitro: { vercel: { functions: { maxDuration: 60 } } },
  app: {
    head: {
      title: 'AI Interior',
      htmlAttrs: { lang: 'en' },
    },
  },
})
