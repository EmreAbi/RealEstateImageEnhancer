import { useState, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Camera, Building2, Mail, Phone, MapPin, Upload, X, Check, Globe } from 'lucide-react'

export default function Settings() {
  const { user, updateProfile, updateProfilePhoto } = useAuth()
  const { settings, updateSettings, updateCompanyLogo, removeCompanyLogo } = useSettings()
  const { t, language, setLanguage, availableLanguages } = useLanguage()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    companyName: settings.companyName || user?.realEstateOffice || '',
    email: settings.email || user?.email || '',
    phone: settings.phone || '',
    address: settings.address || '',
  })

  const logoInputRef = useRef(null)
  const photoInputRef = useRef(null)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveSettings = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await updateSettings(formData)
      setMessage({ type: 'success', text: t('settings.changesSaved') })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' })
      return
    }

    try {
      setLoading(true)
      await updateCompanyLogo(file)
      setMessage({ type: 'success', text: t('settings.logoUpdated') })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Only image files are allowed' })
      return
    }

    try {
      setLoading(true)
      await updateProfilePhoto(file)
      setMessage({ type: 'success', text: t('settings.photoUpdated') })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload photo' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveLogo = async () => {
    if (!confirm('Are you sure you want to remove the company logo?')) return

    try {
      setLoading(true)
      await removeCompanyLogo()
      setMessage({ type: 'success', text: 'Logo removed successfully' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove logo' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600">
            {t('settings.general')}
          </p>
        </div>

        {/* Success/Error Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <Check className="w-5 h-5" />
              ) : (
                <X className="w-5 h-5" />
              )}
              <p className="text-sm font-medium">{message.text}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Language Settings */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('settings.language')}
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('settings.languageSelect')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${language === lang.code
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-medium ${
                        language === lang.code ? 'text-primary-700' : 'text-gray-900'
                      }`}>
                        {lang.name}
                      </p>
                    </div>
                    {language === lang.code && (
                      <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('settings.profilePhoto')}
            </h2>

            <div className="flex items-start gap-6">
              <div className="relative">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {user?.username?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all border border-gray-200"
                >
                  <Camera className="w-4 h-4 text-gray-700" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {user?.username}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {user?.email}
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>• {t('settings.maxImageSize')}</p>
                  <p>• {t('settings.recommendedSize')}</p>
                  <p>• {t('settings.supportedFormats')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Logo */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('settings.companyLogo')}
            </h2>

            <div className="space-y-4">
              {settings.companyLogo ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <img
                    src={settings.companyLogo}
                    alt="Company Logo"
                    className="w-20 h-20 object-contain bg-white rounded-lg border border-gray-200 p-2"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {t('settings.companyLogo')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formData.companyName || 'Company Name'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => logoInputRef.current?.click()}
                      className="btn-secondary text-sm"
                    >
                      {t('settings.changeLogo')}
                    </button>
                    <button
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    >
                      {t('settings.removeLogo')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {t('settings.uploadLogo')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('settings.supportedFormats')}
                  </p>
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Company Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {t('settings.general')}
            </h2>

            <div className="space-y-4">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.companyName')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder={user?.realEstateOffice}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="info@company.com"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.phone')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('settings.address')}
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field pl-10 resize-none"
                    placeholder="123 Main Street, City, Country"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('settings.savingChanges')}
                </span>
              ) : (
                t('settings.saveChanges')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
