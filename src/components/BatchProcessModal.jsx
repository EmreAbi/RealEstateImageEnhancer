import { useState, useEffect } from 'react'
import { X, Sparkles, CheckCircle, XCircle, Clock, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import { useImages } from '../contexts/ImageContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useSettings } from '../contexts/SettingsContext'
import { addWatermark } from '../lib/supabase'

export default function BatchProcessModal({ imageIds, onClose }) {
  const { images, enhanceImages, aiModels, selectedAIModel } = useImages()
  const { t } = useLanguage()
  const { settings } = useSettings()

  // Load from localStorage if available
  const savedState = localStorage.getItem('batchProcessState')
  const initialState = savedState ? JSON.parse(savedState) : null

  const [processing, setProcessing] = useState(initialState?.processing || false)
  const [progress, setProgress] = useState(initialState?.progress || [])
  const [currentIndex, setCurrentIndex] = useState(initialState?.currentIndex || 0)
  const [selectedModel, setSelectedModel] = useState(initialState?.selectedModel || selectedAIModel)

  // Watermark settings
  const [addWatermarkEnabled, setAddWatermarkEnabled] = useState(initialState?.addWatermarkEnabled || false)
  const [watermarkPosition, setWatermarkPosition] = useState(initialState?.watermarkPosition || 'bottom-right')
  const [watermarkOpacity, setWatermarkOpacity] = useState(initialState?.watermarkOpacity || 0.3)

  const hasCompanyLogo = Boolean(settings.companyLogo)

  const selectedImages = images.filter(img => imageIds.includes(img.id))
  const totalImages = selectedImages.length

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (processing || progress.length > 0) {
      const state = {
        processing,
        progress,
        currentIndex,
        selectedModel,
        addWatermarkEnabled,
        watermarkPosition,
        watermarkOpacity,
        imageIds
      }
      localStorage.setItem('batchProcessState', JSON.stringify(state))
    }
  }, [processing, progress, currentIndex, selectedModel, addWatermarkEnabled, watermarkPosition, watermarkOpacity, imageIds])

  // Clear localStorage when modal closes and all done
  useEffect(() => {
    return () => {
      const completedCount = progress.filter(p => p.status === 'completed').length
      const failedCount = progress.filter(p => p.status === 'failed').length
      if (!processing && (completedCount + failedCount) === totalImages) {
        localStorage.removeItem('batchProcessState')
      }
    }
  }, [])

  useEffect(() => {
    // Initialize progress array only if not loaded from localStorage
    if (progress.length === 0) {
      setProgress(selectedImages.map(img => ({
        id: img.id,
        name: img.name,
        status: 'pending' // pending, processing, completed, failed
      })))
    }
  }, [])

  const handleStartProcessing = async () => {
    setProcessing(true)

    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i]
      setCurrentIndex(i)

      // Update status to processing
      setProgress(prev => prev.map(p =>
        p.id === image.id ? { ...p, status: 'processing' } : p
      ))

      try {
        // Step 1: Enhance single image
        await enhanceImages([image.id], selectedModel)

        // Step 2: Add watermark if enabled
        if (addWatermarkEnabled && hasCompanyLogo) {
          await addWatermark({
            imageId: image.id,
            position: watermarkPosition,
            opacity: watermarkOpacity,
            logoUrl: settings.companyLogo
          })
        }

        // Update status to completed
        setProgress(prev => prev.map(p =>
          p.id === image.id ? { ...p, status: 'completed' } : p
        ))
      } catch (error) {
        console.error('Error processing image:', error)

        // Update status to failed
        setProgress(prev => prev.map(p =>
          p.id === image.id ? { ...p, status: 'failed', error: error.message } : p
        ))
      }
    }

    setProcessing(false)
  }

  const completedCount = progress.filter(p => p.status === 'completed').length
  const failedCount = progress.filter(p => p.status === 'failed').length
  const progressPercentage = totalImages > 0 ? Math.round((completedCount / totalImages) * 100) : 0

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'processing':
        return <Sparkles className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const allCompleted = processing === false && (completedCount + failedCount) === totalImages

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-primary-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('batch.title')}</h2>
              <p className="text-sm text-gray-600">{t('batch.imagesWillBeProcessed', { count: totalImages })}</p>
            </div>
          </div>
          {!processing && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Model Selection */}
        {!processing && completedCount === 0 && (
          <div className="p-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('common.aiModel')}
            </label>
            <div className="grid grid-cols-1 gap-3">
              {aiModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`
                    text-left p-4 rounded-lg border-2 transition-all
                    ${selectedModel === model.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`font-semibold ${
                        selectedModel === model.id ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {model.display_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{model.description}</p>
                    </div>
                    {selectedModel === model.id && (
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Watermark Options */}
        {!processing && completedCount === 0 && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addWatermarkEnabled}
                  onChange={(e) => setAddWatermarkEnabled(e.target.checked)}
                  disabled={!hasCompanyLogo}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className={`text-sm font-medium ${!hasCompanyLogo ? 'text-gray-400' : 'text-gray-700'}`}>
                  {t('watermark.addWatermark')}
                </span>
              </label>
              {!hasCompanyLogo && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {t('watermark.noLogo')}
                </span>
              )}
            </div>

            {addWatermarkEnabled && hasCompanyLogo && (
              <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
                {/* Position Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('watermark.position')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'bottom-right', label: t('watermark.bottomRight') },
                      { value: 'bottom-left', label: t('watermark.bottomLeft') },
                      { value: 'top-right', label: t('watermark.topRight') },
                      { value: 'top-left', label: t('watermark.topLeft') },
                    ].map((pos) => (
                      <button
                        key={pos.value}
                        onClick={() => setWatermarkPosition(pos.value)}
                        className={`
                          px-3 py-2 rounded-lg border-2 text-sm transition-all
                          ${watermarkPosition === pos.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                          }
                        `}
                      >
                        {pos.label}
                      </button>
                    ))}
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{t('watermark.subtle')}</span>
                    <span>{t('watermark.bold')}</span>
                  </div>
                </div>

                {/* Logo Preview */}
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{t('watermark.logoPreview')}</p>
                    <p className="text-xs text-gray-500">{t('watermark.willBeApplied')}</p>
                  </div>
                  {settings.companyLogo && (
                    <img
                      src={settings.companyLogo}
                      alt="Logo"
                      className="w-12 h-12 object-contain"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {(processing || allCompleted) && (
          <div className="p-6 border-b border-gray-200">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {processing ? t('batch.processing') : t('batch.allDone')}
              </span>
              <span className="text-gray-600">
                {completedCount} {t('batch.of')} {totalImages} ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-purple-600 to-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            {failedCount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span>{t('batch.failedCount', { count: failedCount })}</span>
              </div>
            )}
          </div>
        )}

        {/* Image List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {progress.map((item, index) => (
              <div
                key={item.id}
                className={`
                  flex items-center justify-between p-3 rounded-lg border transition-all
                  ${item.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                    item.status === 'completed' ? 'bg-green-50 border-green-200' :
                    item.status === 'failed' ? 'bg-red-50 border-red-200' :
                    'bg-gray-50 border-gray-200'}
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm text-gray-900 truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(item.status)}
                  <span className="text-xs font-medium text-gray-600">
                    {item.status === 'pending' ? t('batch.pending') :
                     item.status === 'processing' ? t('batch.processing') :
                     item.status === 'completed' ? t('batch.completed') :
                     t('batch.failed')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {processing && (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  {t('batch.processingComplete')}
                </span>
              )}
              {allCompleted && (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  {t('batch.allDone')}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              {!processing && !allCompleted && (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleStartProcessing}
                    disabled={!selectedModel}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg hover:from-purple-700 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {t('batch.start')}
                  </button>
                </>
              )}
              {allCompleted && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {t('common.close')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
