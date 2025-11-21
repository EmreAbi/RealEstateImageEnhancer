import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Building2, User, Sparkles, ImagePlus, Zap, Shield, Mail, Lock } from 'lucide-react'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [realEstateOffice, setRealEstateOffice] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
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
        (isRegister ? 'Kayıt başarısız. Lütfen tekrar deneyin.' : 'Giriş başarısız. Email ve şifrenizi kontrol edin.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex">
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
                  AI Powered Enhancement
                </h3>
                <p className="text-primary-100">
                  Görsellerinizi yapay zeka ile profesyonel kaliteye yükseltin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Lightning Fast
                </h3>
                <p className="text-primary-100">
                  Saniyeler içinde görsellerinizi işleyin ve indirin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Secure & Private
                </h3>
                <p className="text-primary-100">
                  Verileriniz güvenli ve gizli olarak saklanır
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-100 text-sm">
          © 2024 Real Estate Image Enhancer. All rights reserved.
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
                {isRegister ? 'Hesap Oluştur' : 'Hoş Geldiniz'}
              </h2>
              <p className="text-gray-600">
                {isRegister ? 'Yeni hesap oluşturun' : 'Devam etmek için giriş yapın'}
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
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    className="input-field pl-12"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şifre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    className="input-field pl-12"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {/* Register-only fields */}
              {isRegister && (
                <>
                  {/* Username Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kullanıcı Adı
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Kullanıcı adınız"
                        className="input-field pl-12"
                        required={isRegister}
                      />
                    </div>
                  </div>

                  {/* Real Estate Office Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emlak Ofisi
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Building2 className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={realEstateOffice}
                        onChange={(e) => setRealEstateOffice(e.target.value)}
                        placeholder="Örn: Lüks Gayrimenkul A.Ş."
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
                    {isRegister ? 'Hesap Oluşturuluyor...' : 'Giriş Yapılıyor...'}
                  </span>
                ) : (
                  isRegister ? 'Hesap Oluştur' : 'Giriş Yap'
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
                {isRegister
                  ? 'Zaten hesabınız var mı? Giriş yapın'
                  : 'Hesabınız yok mu? Kayıt olun'}
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ImagePlus className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">Kolay Yükleme</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">Hızlı İşlem</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-50 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <p className="text-xs text-gray-600">Güvenli</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
