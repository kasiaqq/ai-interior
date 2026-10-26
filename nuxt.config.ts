// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@pinia/nuxt', '@nuxt/fonts'],
  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],
  components: [{ path: '~/components', pathPrefix: false }],
  app: {
    head: {
      title: 'AI Interior',
      htmlAttrs: { lang: 'en' },
    },
  },
})
