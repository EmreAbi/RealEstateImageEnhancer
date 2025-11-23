import { useState, useEffect } from 'react'
import { X, Download, Sparkles, Calendar, HardDrive, Maximize2, AlertTriangle, Share2 } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import ShareModal from './ShareModal'
import ImageToolsPanel from './ImageToolsPanel'

export default function ImageModal({ image, onClose }) {
  const { t } = useLanguage()
  const [showShareModal, setShowShareModal] = useState(false)
  const [showOriginal, setShowOriginal] = useState(false)


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
            {/* Left Column - Image + Metadata */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Preview */}
              <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={
                    showOriginal
                      ? image.original_url
                      : (image.watermarked_url || image.enhanced_url || image.original_url)
                  }
                  alt={image.name}
                  className="max-w-full max-h-full object-contain"
                />
                {/* Label to indicate which version is showing */}
                {(image.enhanced_url || image.watermarked_url) && (
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black bg-opacity-70 text-white text-sm font-medium rounded-lg">
                    {showOriginal ? t('images.original') : t('images.processed')}
                  </div>
                )}
              </div>

              {/* Metadata Below Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    {t('images.status')}
                  </h3>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.color} text-sm font-medium rounded-lg`}>
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
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    {t('images.information')}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-900 font-medium">
                          {new Date(image.created_at).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-900 font-medium">
                        {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </p>
                    </div>

                    {/* AI Model Info - Show only if enhanced */}
                    {image.status === 'enhanced' && image.metadata?.enhancement?.model && (
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-900 font-medium">
                          {image.metadata.enhancement.model.includes('openai') || image.metadata.enhancement.model.includes('gpt-image')
                            ? '🤖 OpenAI'
                            : image.metadata.enhancement.model.includes('flux-pro')
                            ? '🎨 Flux Pro'
                            : image.metadata.enhancement.model.includes('reve')
                            ? '🎨 Reve Remix'
                            : image.metadata.enhancement.model.includes('nano')
                            ? '🎨 Nano Banana'
                            : image.metadata.enhancement.model
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions - Below Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowShareModal(true)}
                  className="w-full flex items-center justify-center gap-2 btn-secondary"
                >
                  <Share2 className="w-5 h-5" />
                  {t('images.share')}
                </button>

                <a
                  href={
                    showOriginal
                      ? image.original_url
                      : (image.watermarked_url || image.enhanced_url || image.original_url)
                  }
                  download={image.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 btn-primary"
                >
                  <Download className="w-5 h-5" />
                  {t('common.download')} {showOriginal && `(${t('images.original')})`}
                </a>
              </div>
            </div>

            {/* Right Column - Tools Only */}
            <div>
              {/* Image Tools Panel */}
              <ImageToolsPanel
                image={image}
                onShowOriginalChange={setShowOriginal}
              />
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
