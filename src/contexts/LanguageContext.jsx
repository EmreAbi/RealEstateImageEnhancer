import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../i18n/translations'

const LanguageContext = createContext(null)

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get from localStorage or browser language or default to 'en'
    const saved = localStorage.getItem('language')
    if (saved && translations[saved]) return saved

    const browserLang = navigator.language.split('-')[0]
    if (translations[browserLang]) return browserLang

    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    document.documentElement.lang = language
  }, [language])

  const t = (key, params = {}) => {
    const keys = key.split('.')
    let value = translations[language]

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k]
      } else {
        // Fallback to English if translation not found
        let fallback = translations['en']
        for (const fk of keys) {
          if (fallback && typeof fallback === 'object') {
            fallback = fallback[fk]
          } else {
            return key // Return key if no translation found
          }
        }
        value = fallback
        break
      }
    }

    if (typeof value === 'string') {
      // Replace parameters in translation
      return value.replace(/\{(\w+)\}/g, (match, param) => {
        return params[param] !== undefined ? params[param] : match
      })
    }

    return key // Return key if translation not found
  }

  const changeLanguage = (newLanguage) => {
    if (translations[newLanguage]) {
      setLanguage(newLanguage)
    }
  }

  const availableLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ]

  const value = {
    language,
    setLanguage: changeLanguage,
    t,
    availableLanguages,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
