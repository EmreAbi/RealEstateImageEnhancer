import { useState, useEffect } from 'react'
import { X, Sparkles, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { useImages } from '../contexts/ImageContext'

export default function BatchProcessModal({ imageIds, onClose }) {
  const { images, enhanceImages, aiModels, selectedAIModel } = useImages()
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedModel, setSelectedModel] = useState(selectedAIModel)

  const selectedImages = images.filter(img => imageIds.includes(img.id))
  const totalImages = selectedImages.length

  useEffect(() => {
    // Initialize progress array
    setProgress(selectedImages.map(img => ({
      id: img.id,
      name: img.name,
      status: 'pending' // pending, processing, completed, failed
    })))
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
        // Enhance single image
        await enhanceImages([image.id], selectedModel)

        // Update status to completed
        setProgress(prev => prev.map(p =>
          p.id === image.id ? { ...p, status: 'completed' } : p
        ))
      } catch (error) {
        console.error('Error enhancing image:', error)

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-primary-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Toplu AI İyileştirme</h2>
              <p className="text-sm text-gray-600">{totalImages} görsel işlenecek</p>
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
              AI Modeli Seçin
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

        {/* Progress Bar */}
        {(processing || allCompleted) && (
          <div className="p-6 border-b border-gray-200">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                {processing ? 'İşleniyor...' : 'Tamamlandı'}
              </span>
              <span className="text-gray-600">
                {completedCount} / {totalImages} ({progressPercentage}%)
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
                <span>{failedCount} görsel işlenemedi</span>
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
                    {item.status === 'pending' ? 'Bekliyor' :
                     item.status === 'processing' ? 'İşleniyor' :
                     item.status === 'completed' ? 'Tamamlandı' :
                     'Başarısız'}
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
                  Lütfen bekleyin, görseller işleniyor...
                </span>
              )}
              {allCompleted && (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  İşlem tamamlandı!
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
                    İptal
                  </button>
                  <button
                    onClick={handleStartProcessing}
                    disabled={!selectedModel}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg hover:from-purple-700 hover:to-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    İşlemeyi Başlat
                  </button>
                </>
              )}
              {allCompleted && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
