import { X, Download, Sparkles, Calendar, HardDrive, Maximize2 } from 'lucide-react'
import { useImages } from '../contexts/ImageContext'

export default function ImageModal({ image, onClose }) {
  const { enhanceImages } = useImages()

  const handleEnhance = async () => {
    await enhanceImages([image.id])
  }

  const getStatusInfo = (status) => {
    switch (status) {
      case 'original':
        return {
          text: 'Orijinal',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100'
        }
      case 'processing':
        return {
          text: 'İşleniyor',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100'
        }
      case 'enhanced':
        return {
          text: 'İyileştirildi',
          color: 'text-green-700',
          bgColor: 'bg-green-100'
        }
      default:
        return {
          text: 'Bilinmiyor',
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
              <div className="bg-gray-100 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                <img
                  src={image.enhanced_url || image.original_url}
                  alt={image.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            {/* Image Details */}
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Durum
                </h3>
                <span className={`inline-flex items-center gap-2 px-4 py-2 ${statusInfo.bgColor} ${statusInfo.color} text-sm font-medium rounded-lg`}>
                  {image.status === 'processing' && (
                    <Sparkles className="w-4 h-4 animate-spin" />
                  )}
                  {image.status === 'enhanced' && (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {statusInfo.text}
                </span>
              </div>

              {/* Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                  Bilgiler
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Yüklenme Tarihi</p>
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
                      <p className="text-xs text-gray-500">Dosya Boyutu</p>
                      <p className="text-sm font-medium text-gray-900">
                        {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Maximize2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Dosya Adı</p>
                      <p className="text-sm font-medium text-gray-900 break-all">
                        {image.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                {image.status === 'original' && (
                  <button
                    onClick={handleEnhance}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-primary-600 hover:from-purple-700 hover:to-primary-700 text-white px-4 py-3 rounded-lg transition-all duration-200 shadow-soft hover:shadow-elegant font-medium"
                  >
                    <Sparkles className="w-5 h-5" />
                    AI ile İyileştir
                  </button>
                )}

                {image.status === 'processing' && (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-3 rounded-lg font-medium cursor-not-allowed"
                  >
                    <Sparkles className="w-5 h-5 animate-spin" />
                    İşleniyor...
                  </button>
                )}

                {image.status === 'enhanced' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="font-semibold">İyileştirildi</span>
                    </div>
                    <p className="text-sm text-green-600">
                      Bu görsel başarıyla AI ile iyileştirildi.
                    </p>
                  </div>
                )}

                <a
                  href={image.enhanced_url || image.original_url}
                  download={image.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 btn-secondary"
                >
                  <Download className="w-5 h-5" />
                  İndir
                </a>
              </div>

              {/* Tips */}
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-lg">
                <h4 className="text-sm font-semibold text-primary-900 mb-2">
                  💡 İpucu
                </h4>
                <p className="text-xs text-primary-700">
                  AI iyileştirme özelliği görsellerinizin kalitesini artırır,
                  detayları netleştirir ve profesyonel bir görünüm kazandırır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
