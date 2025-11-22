import { useState, useEffect } from 'react'
import { X, Download, Sparkles, Droplet, Calendar, HardDrive, Maximize2, AlertTriangle, RotateCcw, Share2, Sofa } from 'lucide-react'
import { useImages } from '../contexts/ImageContext'
import { useSettings } from '../contexts/SettingsContext'
import { useLanguage } from '../contexts/LanguageContext'
import { supabase } from '../lib/supabase'
import ShareModal from './ShareModal'
import ImageWatermarkPanel from './ImageWatermarkPanel'

export default function ImageModal({ image, onClose }) {
  const { t } = useLanguage()
  const { enhanceImages, decorateRooms } = useImages()
  const { settings } = useSettings()
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [aiModels, setAiModels] = useState([])
  const [selectedModel, setSelectedModel] = useState(null)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showWatermarkPanel, setShowWatermarkPanel] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isDecorating, setIsDecorating] = useState(false)

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

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const handleTouchMove = (e) => {
    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setSliderPosition(percentage)
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'original':
        return {
          text: t('images.original'),
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      case 'processing':
        return {
          text: t('images.processing'),
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        }
      case 'enhanced':
        return {
          text: t('images.enhanced'),
          color: 'text-green-700',
          bgColor: 'bg-green-100'
        }
      case 'failed':
        return {
          text: t('images.failed'),
          color: 'text-red-700',
          bgColor: 'bg-red-100'
        }
      default:
        return {
          text: t('images.status'),
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
    }
  }

  const statusInfo = getStatusInfo(image.status)

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {image.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(image.created_at).toLocaleString('tr-TR')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Image Preview */}
            <div className="lg:col-span-2">
              {image.status === 'enhanced' && image.enhanced_url ? (
                /* Before/After Slider for Enhanced Images */
                <div 
                  className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video select-none cursor-ew-resize"
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchEnd={handleMouseUp}
                  onTouchMove={handleTouchMove}
                >
                  {/* Enhanced Image (Background) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={image.enhanced_url}
                      alt={`${image.name} - İyileştirilmiş`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Original Image (Clipped overlay) */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                  >
                    <img
                      src={image.original_url}
                      alt={`${image.name} - Orijinal`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Slider Line */}
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-0.5 h-4 bg-gray-400"></div>
                        <div className="w-0.5 h-4 bg-gray-400"></div>
                      </div>
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-black bg-opacity-70 text-white text-sm font-medium rounded-lg pointer-events-none">
                    {t('images.original')}
                  </div>
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black bg-opacity-70 text-white text-sm font-medium rounded-lg pointer-events-none">
                    {t('images.enhanced')}
                  </div>
                </div>
              ) : (
                /* Regular Image Display */
                <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <img
                    src={image.watermarked_url || image.enhanced_url || image.original_url}
                    alt={image.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Image Details */}
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  {t('images.status')}
                </h3>
                <span className={`inline-flex items-center gap-2 px-4 py-2 ${statusInfo.bgColor} ${statusInfo.color} text-sm font-medium rounded-lg`}>
                  {image.status === 'processing' && (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  )}
                  {image.status === 'enhanced' && (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {image.status === 'failed' && (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  {statusInfo.text}
                </span>
              </div>

              {/* Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  {t('images.information')}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{t('images.uploadDate')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(image.created_at).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <HardDrive className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{t('images.fileSize')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Maximize2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{t('images.fileName')}</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {image.name}
                      </p>
                    </div>
                  </div>

                  {/* AI Model Info - Show only if enhanced */}
                  {image.status === 'enhanced' && image.metadata?.enhancement?.model && (
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500">{t('images.enhancementModel')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {image.metadata.enhancement.model.includes('openai') || image.metadata.enhancement.model.includes('gpt-image') 
                            ? '🤖 OpenAI GPT-Image-1' 
                            : image.metadata.enhancement.model.includes('flux-pro')
                            ? '🎨 FAL.AI Flux Pro'
                            : image.metadata.enhancement.model.includes('reve')
                            ? '🎨 FAL.AI Reve Remix'
                            : image.metadata.enhancement.model.includes('nano')
                            ? '🎨 FAL.AI Nano Banana Pro'
                            : image.metadata.enhancement.model
                          }
                        </p>
                        {image.metadata.enhancement.updated_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(image.metadata.enhancement.updated_at).toLocaleString('tr-TR')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                {(image.status === 'original' || image.status === 'enhanced') && (
                  <>
                    {/* AI Model Selector - Dropdown */}
                    {aiModels.length > 1 && (
                      <div className="space-y-2 model-selector-dropdown">
                        <label className="text-xs font-medium text-gray-700">{t('images.selectModel')}</label>
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
                    
                    <button
                      onClick={handleEnhance}
                      disabled={!selectedModel || isEnhancing || isDecorating}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-primary-600 hover:from-blue-700 hover:to-primary-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className={`w-5 h-5 ${isEnhancing ? 'animate-spin' : ''}`} />
                      {isEnhancing ? t('images.enhancing') : (image.status === 'enhanced' ? t('images.enhanceAgain') : t('images.enhance'))}
                    </button>

                    {/* Decorate Button */}
                    <button
                      onClick={handleDecorate}
                      disabled={!selectedModel || isEnhancing || isDecorating}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sofa className={`w-5 h-5 ${isDecorating ? 'animate-pulse' : ''}`} />
                      {isDecorating ? t('decoration.decorating') : t('decoration.decorateRoom')}
                    </button>

                    {/* Watermark Button */}
                    <button
                      onClick={() => setShowWatermarkPanel(!showWatermarkPanel)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium"
                    >
                      <Droplet className="w-5 h-5" />
                      {t('watermark.addWatermark')}
                    </button>

                    {/* Watermark Panel */}
                    {showWatermarkPanel && (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <ImageWatermarkPanel
                          image={image}
                          onClose={() => setShowWatermarkPanel(false)}
                        />
                      </div>
                    )}
                  </>
                )}

                {image.status === 'processing' && (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-3 rounded-lg font-medium cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5 animate-spin" />
                    {t('images.processing')}
                  </button>
                )}

                {image.status === 'enhanced' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">{t('images.successfullyEnhanced')}</span>
                    </div>
                    <p className="text-sm text-green-600">
                      {t('images.enhancedSuccessfully')}
                    </p>
                  </div>
                )}

                {image.status === 'failed' && (
                  <div className="space-y-3">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <span className="font-semibold">{t('images.processingFailed')}</span>
                      </div>
                      <p className="text-sm text-red-600">
                        {t('images.processingFailedMessage')}
                      </p>
                    </div>

                    {/* AI Model Selector - Dropdown for retry */}
                    {aiModels.length > 1 && (
                      <div className="space-y-2 model-selector-dropdown">
                        <label className="text-xs font-medium text-gray-700">{t('images.tryDifferentModel')}</label>
                        <div className="relative">
                          <button
                            onClick={() => setShowModelSelect(!showModelSelect)}
                            className="w-full p-3 bg-white border-2 border-gray-200 hover:border-primary-300 rounded-lg transition-all text-left flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary-600" />
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">
                                  {selectedModel?.display_name || 'Model Seçin'}
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

                    <button
                      onClick={handleEnhance}
                      disabled={!selectedModel}
                      className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-5 h-5" />
                      {selectedModel ? t('images.retryWith', { model: selectedModel.display_name }) : t('images.retry')}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center gap-2 btn-secondary"
                >
                  <Share2 className="w-5 h-5" />
                  {t('images.share')}
                </button>

                <a
                  href={image.watermarked_url || image.enhanced_url || image.original_url}
                  download={image.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 btn-primary"
                >
                  <Download className="w-5 h-5" />
                  {t('common.download')}
                </a>
              </div>

              {/* Tips */}
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                <h4 className="text-sm font-semibold text-primary-900 mb-2">
                  {t('images.tip')}
                </h4>
                <p className="text-xs text-primary-700">
                  {t('images.aiTip')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          image={image}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
