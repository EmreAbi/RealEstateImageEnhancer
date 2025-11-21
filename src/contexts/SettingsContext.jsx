import { createContext, useContext, useState, useEffect } from 'react'

const SettingsContext = createContext(null)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('settings')
    if (saved) {
      return JSON.parse(saved)
    }
    return {
      companyName: '',
      companyLogo: null,
      email: '',
      phone: '',
      address: '',
    }
  })

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateSettings = (newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }))
  }

  // Company Logo
  const updateCompanyLogo = async (file) => {
    // Mock upload - in production, this will upload to Supabase Storage
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const logoUrl = reader.result
        updateSetting('companyLogo', logoUrl)
        resolve(logoUrl)
      }
      reader.readAsDataURL(file)
    })
  }

  const removeCompanyLogo = async () => {
    // Mock delete - in production, this will delete from Supabase Storage
    updateSetting('companyLogo', null)
  }

  const value = {
    settings,
    updateSetting,
    updateSettings,
    updateCompanyLogo,
    removeCompanyLogo,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
