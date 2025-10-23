// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/i18n'
  ],
  i18n: {
    locales: [
      { code: 'es', iso: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'en', iso: 'en-GB', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'es',
    strategy: 'no_prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: false,
      fallbackLocale: 'es'
    }
  }
})
