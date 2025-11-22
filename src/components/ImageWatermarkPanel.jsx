import { useState, useEffect } from 'react'
import { Droplet, Image as ImageIcon, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useSettings } from '../contexts/SettingsContext'
import { useImages } from '../contexts/ImageContext'
import { addWatermark } from '../lib/supabase'
import { generateWatermarkPreview } from '../lib/watermark'

export default function ImageWatermarkPanel({ image, onClose }) {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const { refreshData } = useImages()

  const [watermarkPosition, setWatermarkPosition] = useState('bottom-right')
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3)
  const [logoSize, setLogoSize] = useState(10) // Percentage
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  const hasCompanyLogo = Boolean(settings.companyLogo)

  // Generate preview when settings change
  useEffect(() => {
    if (!hasCompanyLogo || !image) return

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
  }, [watermarkPosition, watermarkOpacity, logoSize, hasCompanyLogo, settings.companyLogo, image])

  const handleAddWatermark = async () => {
    if (!hasCompanyLogo) return

    setProcessing(true)
    setError(null)

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

      // Close panel after success
      if (onClose) {
        setTimeout(() => onClose(), 1000)
      }
    } catch (err) {
      console.error('Watermark error:', err)
      setError(err.message || t('watermark.error'))
    } finally {
      setProcessing(false)
    }
  }

  if (!hasCompanyLogo) {
    return (
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
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
          <Droplet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('watermark.addWatermark')}
          </h3>
          <p className="text-xs text-gray-600">{t('watermark.configureSettings')}</p>
        </div>
      </div>

      {/* Real-time Preview */}
      {previewUrl && (
        <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-gray-50">
          {previewLoading ? (
            <div className="aspect-[4/3] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
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
          <div className="px-3 py-2 bg-blue-50 border-t border-blue-200">
            <p className="text-xs text-blue-700 font-medium">{t('watermark.preview')}</p>
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
              disabled={processing}
              className={`
                px-3 py-2 rounded-lg border-2 text-sm transition-all disabled:opacity-50
                ${watermarkPosition === pos.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                }
                ${pos.value === 'center' ? 'col-span-1' : ''}
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
          disabled={processing}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
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
          disabled={processing}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{t('watermark.subtle')}</span>
          <span>{t('watermark.bold')}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleAddWatermark}
          disabled={processing || !hasCompanyLogo}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {processing ? (
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
        {onClose && (
          <button
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </div>
  )
}
