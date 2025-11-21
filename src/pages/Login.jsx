import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Building2, User, Sparkles, ImagePlus, Zap, Shield, Mail, Lock, Globe } from 'lucide-react'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [realEstateOffice, setRealEstateOffice] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showLangMenu, setShowLangMenu] = useState(false)

  const { login, register } = useAuth()
  const { t, language, setLanguage, availableLanguages } = useLanguage()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) return
    if (isRegister && (!username || !realEstateOffice)) return

    setLoading(true)

    try {
      if (isRegister) {
        await register(email, password, username, realEstateOffice)
      } else {
        await login(email, password)
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('Authentication failed:', error)
      setError(
        error.message ||
        (isRegister ? t('auth.registrationFailed') : t('auth.invalidCredentials'))
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-soft hover:shadow-md transition-all"
          >
            <Globe className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {availableLanguages.find(l => l.code === language)?.flag}
            </span>
            <span className="text-sm text-gray-600">
              {availableLanguages.find(l => l.code === language)?.name}
            </span>
          </button>

          {showLangMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowLangMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-elegant z-20 min-w-[200px] overflow-hidden">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangMenu(false)
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${language === lang.code
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-sm font-medium">{lang.name}</span>
                    {language === lang.code && (
                      <div className="ml-auto w-2 h-2 bg-primary-600 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Real Estate Image Enhancer
            </h1>
          </div>

          <div className="space-y-8 mt-16">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <ImagePlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('features.aiPowered')}
                </h3>
                <p className="text-primary-100">
                  {t('features.aiDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('features.lightningFast')}
                </h3>
                <p className="text-primary-100">
                  {t('features.fastDescription')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {t('features.securePrivate')}
                </h3>
                <p className="text-primary-100">
                  {t('features.secureDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-100 text-sm">
          {t('footer.allRightsReserved')}
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="bg-primary-100 p-3 rounded-xl">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Image Enhancer
            </h1>
          </div>

          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {isRegister ? t('auth.createAccount') : t('auth.welcomeBack')}
              </h2>
              <p className="text-gray-600">
                {isRegister ? t('auth.createNewAccount') : t('auth.loginToContinue')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="input-field pl-12 pr-12"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <span className="text-xs text-gray-500 hover:text-gray-700">
                      {showPassword ? 'Hide' : 'Show'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Register-only fields */}
              {isRegister && (
                <>
                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.username')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('auth.usernamePlaceholder')}
                        className="input-field pl-12"
                        required={isRegister}
                      />
                    </div>
                  </div>

                  {/* Real Estate Office Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.realEstateOffice')}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={realEstateOffice}
                        onChange={(e) => setRealEstateOffice(e.target.value)}
                        placeholder={t('auth.realEstateOfficePlaceholder')}
                        className="input-field pl-12"
                        required={isRegister}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
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
                    {isRegister ? t('auth.creatingAccount') : t('auth.loggingIn')}
                  </span>
                ) : (
                  isRegister ? t('auth.createAccountButton') : t('auth.loginButton')
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                }}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isRegister ? t('auth.alreadyHaveAccount') : t('auth.noAccount')}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ImagePlus className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">{t('features.easyUpload')}</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">{t('features.fastProcessing')}</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">{t('features.secure')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
