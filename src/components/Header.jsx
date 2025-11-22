import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useImages } from '../contexts/ImageContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useNotifications } from '../contexts/NotificationContext'
import {
  Menu,
  Upload,
  Sparkles,
  Droplet,
  LogOut,
  ChevronDown,
  Search,
  Bell,
  Settings,
  BarChart3,
  Globe
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import BatchProcessModal from './BatchProcessModal'
import WatermarkModal from './WatermarkModal'
import NotificationPanel from './NotificationPanel'

export default function Header({ onToggleSidebar, onUpload, searchQuery, onSearchChange }) {
  const { t, language, setLanguage, availableLanguages } = useLanguage()
  const { user, profile, logout } = useAuth()
  const { selectedImages, clearSelection } = useImages()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [showWatermarkModal, setShowWatermarkModal] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleLogout = async () => {
    console.log('🚪 Logout clicked')
    try {
      setShowUserMenu(false) // Close menu first
      await logout()
      console.log('✅ Logout successful')
      // No need to navigate - auth state change will handle redirect
    } catch (error) {
      console.error('❌ Logout error:', error)
      alert(t('common.logoutError'))
    }
  }

  const handleEnhance = () => {
    if (selectedImages.length === 0) return
    setShowBatchModal(true)
  }

  const handleWatermark = () => {
    if (selectedImages.length === 0) return
    setShowWatermarkModal(true)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 w-80">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.searchImages')}
                value={searchQuery || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Enhanced Button */}
            {selectedImages.length > 0 && (
              <>
                <button
                  onClick={handleEnhance}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-700 hover:to-primary-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">
                    {t('common.enhanceImages', { count: selectedImages.length })}
                  </span>
                </button>
                <button
                  onClick={handleWatermark}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant"
                >
                  <Droplet className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">
                    {t('watermark.addWatermark')}
                  </span>
                </button>
              </>
            )}

            {/* Upload Button */}
            <button
              onClick={onUpload}
              className="btn-primary flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              <span className="hidden sm:inline">{t('common.upload')}</span>
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('settings.language')}
              >
                <Globe className="w-5 h-5 text-gray-600" />
              </button>

              {showLangMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowLangMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-elegant z-20 min-w-[180px] overflow-hidden">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code)
                          setShowLangMenu(false)
                        }}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                          ${language === lang.code
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm font-medium">{lang.name}</span>
                        {language === lang.code && (
                          <div className="ml-auto w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </div>

            {/* Settings */}
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors hidden md:block"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-3 pr-2 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="hidden md:block text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {profile?.username || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">
                    {profile?.real_estate_office}
                  </p>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {(profile?.username?.[0] || user?.email?.[0])?.toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-elegant z-20 overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {profile?.username || user?.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {profile?.real_estate_office}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {profile?.email || user?.email}
                      </p>
                    </div>

                    <div className="p-2">
                      <button
                        onClick={() => {
                          navigate('/dashboard/analytics')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('common.statistics')}</span>
                      </button>

                      <button
                        onClick={() => {
                          navigate('/dashboard/settings')
                          setShowUserMenu(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('common.settings')}</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">{t('common.logout')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('common.searchImages')}
            value={searchQuery || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Batch Process Modal */}
      {showBatchModal && (
        <BatchProcessModal
          imageIds={selectedImages}
          onClose={() => {
            setShowBatchModal(false)
            clearSelection()
          }}
        />
      )}

      {/* Watermark Modal */}
      {showWatermarkModal && (
        <WatermarkModal
          imageIds={selectedImages}
          onClose={() => {
            setShowWatermarkModal(false)
            clearSelection()
          }}
        />
      )}
    </header>
  )
}
