import { useState, useEffect } from 'react'
import { Sparkles, Droplet, Sofa, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSettings } from '../contexts/SettingsContext'
import { useImages } from '../contexts/ImageContext'
import { supabase, addWatermark } from '../lib/supabase'
import { generateWatermarkPreview } from '../lib/watermark'

export default function ImageToolsPanel({ image, onShowOriginalChange }) {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const { enhanceImages, decorateRooms, refreshData } = useImages()

  // Tab state
  const [activeTab, setActiveTab] = useState('enhance')

  // Before/After toggle state
  const [showOriginal, setShowOriginal] = useState(false)

  // AI Models state (shared between Enhance and Decorate)
  const [aiModels, setAiModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showModelSelect, setShowModelSelect] = useState(false)

  // Processing states
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isDecorating, setIsDecorating] = useState(false)

  // Watermark state
  const savedSettings = JSON.parse(localStorage.getItem('watermarkSettings') || '{}')
  const [watermarkPosition, setWatermarkPosition] = useState(savedSettings.position || 'bottom-right')
  const [watermarkOpacity, setWatermarkOpacity] = useState(savedSettings.opacity || 0.3)
  const [logoSize, setLogoSize] = useState(savedSettings.logoSize || 10)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [isWatermarking, setIsWatermarking] = useState(false)
  const [watermarkError, setWatermarkError] = useState(null)

  const hasCompanyLogo = Boolean(settings.companyLogo)

  // Check if image has any processed versions
  const hasProcessedVersions = Boolean(image.enhanced_url || image.watermarked_url)

  useEffect(() => {
    fetchAiModels()
  }, [])

  useEffect(() => {
    // Set default model from settings
    if (aiModels.length > 0 && !selectedModel) {
      const preferred = aiModels.find(m => m.model_identifier === settings.preferredAiModel)
      setSelectedModel(preferred || aiModels[0])
    }
  }, [aiModels, settings.preferredAiModel])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showModelSelect && !e.target.closest('.model-selector-dropdown')) {
        setShowModelSelect(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showModelSelect])

  // Save watermark settings to localStorage
  useEffect(() => {
    const settingsToSave = {
      position: watermarkPosition,
      opacity: watermarkOpacity,
      logoSize: logoSize
    }
    localStorage.setItem('watermarkSettings', JSON.stringify(settingsToSave))
  }, [watermarkPosition, watermarkOpacity, logoSize])

  // Generate watermark preview when settings change
  useEffect(() => {
    if (!hasCompanyLogo || !image || activeTab !== 'watermark') return

    const generatePreview = async () => {
      setPreviewLoading(true)
      try {
        const sourceUrl = image.watermarked_url || image.enhanced_url || image.original_url
        const preview = await generateWatermarkPreview(sourceUrl, settings.companyLogo, {
          position: watermarkPosition,
          opacity: watermarkOpacity,
          logoScale: logoSize / 100,
          maxWidth: 400,
          maxHeight: 300
        })
        setPreviewUrl(preview)
      } catch (err) {
        console.error('Preview error:', err)
      } finally {
        setPreviewLoading(false)
      }
    }

    generatePreview()
  }, [watermarkPosition, watermarkOpacity, logoSize, hasCompanyLogo, settings.companyLogo, image, activeTab])

  // Notify parent when showOriginal changes
  useEffect(() => {
    if (onShowOriginalChange) {
      onShowOriginalChange(showOriginal)
    }
  }, [showOriginal, onShowOriginalChange])

  const fetchAiModels = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('provider', { ascending: true })

      if (error) throw error
      setAiModels(data || [])
    } catch (error) {
      console.error('Failed to fetch AI models:', error)
    }
  }

  const handleEnhance = async () => {
    if (selectedModel) {
      try {
        setIsEnhancing(true)
        await enhanceImages([image.id], selectedModel.id)
      } catch (error) {
        console.error('Error enhancing image:', error)
      } finally {
        setIsEnhancing(false)
      }
    }
  }

  const handleDecorate = async () => {
    if (selectedModel) {
      try {
        setIsDecorating(true)
        await decorateRooms([image.id], selectedModel.id)
      } catch (error) {
        console.error('Error decorating room:', error)
      } finally {
        setIsDecorating(false)
      }
    }
  }

  const handleAddWatermark = async () => {
    if (!hasCompanyLogo) return

    setIsWatermarking(true)
    setWatermarkError(null)

    try {
      await addWatermark({
        imageId: image.id,
        position: watermarkPosition,
        opacity: watermarkOpacity,
        logoUrl: settings.companyLogo,
        logoScale: logoSize / 100
      })

      // Reload images to get updated watermarked URL
      await refreshData()
    } catch (err) {
      console.error('Watermark error:', err)
      setWatermarkError(err.message || t('watermark.error'))
    } finally {
      setIsWatermarking(false)
    }
  }

  const tabs = [
    { id: 'enhance', icon: Sparkles, label: t('images.enhance'), color: 'from-blue-600 to-primary-600' },
    { id: 'watermark', icon: Droplet, label: t('watermark.addWatermark'), color: 'from-cyan-600 to-teal-600' },
    { id: 'decorate', icon: Sofa, label: t('decoration.decorateRoom'), color: 'from-purple-600 to-pink-600' }
  ]

  return (
    <div className="space-y-4">
      {/* Before/After Toggle - Only show if there are processed versions */}
      {hasProcessedVersions && (
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {showOriginal ? (
                <EyeOff className="w-5 h-5 text-gray-600" />
              ) : (
                <Eye className="w-5 h-5 text-primary-600" />
              )}
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {t('images.viewMode')}
                </h4>
                <p className="text-xs text-gray-600">
                  {showOriginal ? t('images.showingOriginal') : t('images.showingProcessed')}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white shadow-md text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : ''}`} />
              <span className="text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* ENHANCE TAB */}
        {activeTab === 'enhance' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-primary-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('images.enhanceImage')}
                </h3>
                <p className="text-xs text-gray-600">{t('images.aiTip')}</p>
              </div>
            </div>

            {/* AI Model Selector */}
            {aiModels.length > 0 && (
              <div className="space-y-2 model-selector-dropdown">
                <label className="text-sm font-medium text-gray-700">{t('images.selectModel')}</label>
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className="w-full p-3 bg-white border-2 border-gray-200 hover:border-primary-300 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {selectedModel?.display_name || t('images.selectModel')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedModel?.provider === 'openai' ? '🤖 OpenAI' : selectedModel?.provider === 'fal-ai' ? '🎨 FAL.AI' : ''}
                        </div>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${
                      showModelSelect ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showModelSelect && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model)
                            setShowModelSelect(false)
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedModel?.id === model.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className={`w-4 h-4 ${
                                selectedModel?.id === model.id ? 'text-primary-600' : 'text-gray-400'
                              }`} />
                              <div>
                                <div className={`font-semibold text-sm ${
                                  selectedModel?.id === model.id ? 'text-primary-900' : 'text-gray-900'
                                }`}>
                                  {model.display_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {model.provider === 'openai' ? '🤖 OpenAI' : '🎨 FAL.AI'}
                                </div>
                              </div>
                            </div>
                            {selectedModel?.id === model.id && (
                              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhance Button */}
            <button
              onClick={handleEnhance}
              disabled={!selectedModel || isEnhancing || isDecorating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-primary-600 hover:from-blue-700 hover:to-primary-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-5 h-5 ${isEnhancing ? 'animate-spin' : ''}`} />
              {isEnhancing ? t('images.enhancing') : (image.status === 'enhanced' ? t('images.enhanceAgain') : t('images.enhance'))}
            </button>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                💡 {t('images.tip')}
              </h4>
              <p className="text-xs text-blue-700">
                {t('images.enhanceTip')}
              </p>
            </div>
          </div>
        )}

        {/* WATERMARK TAB */}
        {activeTab === 'watermark' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('watermark.addWatermark')}
                </h3>
                <p className="text-xs text-gray-600">{t('watermark.configureSettings')}</p>
              </div>
            </div>

            {!hasCompanyLogo ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                      {t('watermark.noLogo')}
                    </h4>
                    <p className="text-xs text-amber-700">
                      {t('watermark.uploadLogoFirst')}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Real-time Preview */}
                {previewUrl && (
                  <div className="border-2 border-cyan-200 rounded-lg overflow-hidden bg-gray-50">
                    {previewLoading ? (
                      <div className="aspect-[4/3] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                          <svg className="animate-spin h-8 w-8 text-cyan-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <p className="text-sm text-gray-600">{t('watermark.generatingPreview')}</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-auto"
                      />
                    )}
                    <div className="px-3 py-2 bg-cyan-50 border-t border-cyan-200">
                      <p className="text-xs text-cyan-700 font-medium">{t('watermark.preview')}</p>
                    </div>
                  </div>
                )}

                {/* Position Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('watermark.position')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'top-left', label: t('watermark.topLeft') },
                      { value: 'top-right', label: t('watermark.topRight') },
                      { value: 'center', label: t('watermark.center') },
                      { value: 'bottom-left', label: t('watermark.bottomLeft') },
                      { value: 'bottom-right', label: t('watermark.bottomRight') },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setWatermarkPosition(pos.value)}
                        disabled={isWatermarking}
                        className={`
                          px-3 py-2 rounded-lg border-2 text-sm transition-all disabled:opacity-50
                          ${watermarkPosition === pos.value
                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }
                        `}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('watermark.logoSize')}
                    </label>
                    <span className="text-sm text-gray-600">{logoSize}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={logoSize}
                    onChange={(e) => setLogoSize(parseInt(e.target.value))}
                    disabled={isWatermarking}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{t('watermark.small')}</span>
                    <span>{t('watermark.large')}</span>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t('watermark.opacity')}
                    </label>
                    <span className="text-sm text-gray-600">{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    disabled={isWatermarking}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-600 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{t('watermark.subtle')}</span>
                    <span>{t('watermark.bold')}</span>
                  </div>
                </div>

                {/* Error Message */}
                {watermarkError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-700">{watermarkError}</p>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={handleAddWatermark}
                  disabled={isWatermarking}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isWatermarking ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{t('watermark.addingWatermark')}</span>
                    </>
                  ) : (
                    <>
                      <Droplet className="w-5 h-5" />
                      <span>{t('watermark.apply')}</span>
                    </>
                  )}
                </button>

                {/* Info Box */}
                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-lg">
                  <h4 className="text-sm font-semibold text-cyan-900 mb-2">
                    💡 {t('images.tip')}
                  </h4>
                  <p className="text-xs text-cyan-700">
                    {t('watermark.tip')}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* DECORATE TAB */}
        {activeTab === 'decorate' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Sofa className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('decoration.decorateRoom')}
                </h3>
                <p className="text-xs text-gray-600">{t('decoration.virtualStaging')}</p>
              </div>
            </div>

            {/* AI Model Selector */}
            {aiModels.length > 0 && (
              <div className="space-y-2 model-selector-dropdown">
                <label className="text-sm font-medium text-gray-700">{t('images.selectModel')}</label>
                <div className="relative">
                  <button
                    onClick={() => setShowModelSelect(!showModelSelect)}
                    className="w-full p-3 bg-white border-2 border-gray-200 hover:border-primary-300 rounded-lg transition-all text-left flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {selectedModel?.display_name || t('images.selectModel')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {selectedModel?.provider === 'openai' ? '🤖 OpenAI' : selectedModel?.provider === 'fal-ai' ? '🎨 FAL.AI' : ''}
                        </div>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${
                      showModelSelect ? 'rotate-180' : ''
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showModelSelect && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {aiModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model)
                            setShowModelSelect(false)
                          }}
                          className={`w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                            selectedModel?.id === model.id ? 'bg-primary-50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Sparkles className={`w-4 h-4 ${
                                selectedModel?.id === model.id ? 'text-primary-600' : 'text-gray-400'
                              }`} />
                              <div>
                                <div className={`font-semibold text-sm ${
                                  selectedModel?.id === model.id ? 'text-primary-900' : 'text-gray-900'
                                }`}>
                                  {model.display_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {model.provider === 'openai' ? '🤖 OpenAI' : '🎨 FAL.AI'}
                                </div>
                              </div>
                            </div>
                            {selectedModel?.id === model.id && (
                              <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Decorate Button */}
            <button
              onClick={handleDecorate}
              disabled={!selectedModel || isEnhancing || isDecorating}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sofa className={`w-5 h-5 ${isDecorating ? 'animate-pulse' : ''}`} />
              {isDecorating ? t('decoration.decorating') : t('decoration.decorateRoom')}
            </button>

            {/* Info Box */}
            <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">
                💡 {t('images.tip')}
              </h4>
              <p className="text-xs text-purple-700">
                {t('decoration.tip')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
