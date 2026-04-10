import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zhTW from '@/locales/zh-TW.json'

/**
 * Initialize i18next with react-i18next integration.
 * Default language: zh-TW (Traditional Chinese).
 * Fallback language: zh-TW.
 * escapeValue is disabled because React already escapes output.
 */
i18n.use(initReactI18next).init({
  resources: {
    'zh-TW': { translation: zhTW },
  },
  lng: 'zh-TW',
  fallbackLng: 'zh-TW',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
