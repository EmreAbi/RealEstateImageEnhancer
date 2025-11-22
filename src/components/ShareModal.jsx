import { useState } from 'react'
import { X, Link2, Copy, Check, Calendar, Lock } from 'lucide-react'
import { createShareLink } from '../lib/supabase'

export default function ShareModal({ image, onClose }) {
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState(null)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    title: image.name,
    description: '',
    expiresInDays: 7
  })

  const handleCreateLink = async () => {
    try {
      setLoading(true)
      const link = await createShareLink(image.id, formData)
      setShareLink(link)
    } catch (error) {
      console.error('Error creating share link:', error)
      alert('Paylaşım linki oluşturulurken hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/share/${shareLink.share_token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Link2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Paylaşım Linki Oluştur</h2>
              <p className="text-sm text-gray-600">Görseli link ile paylaş</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!shareLink ? (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.enhanced_url || image.original_url}
                  alt={image.name}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white font-medium truncate">{image.name}</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Başlık (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Görsel başlığı..."
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Açıklama (Opsiyonel)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  placeholder="Görsel hakkında bilgi..."
                />
              </div>

              {/* Expiration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Geçerlilik Süresi
                </label>
                <select
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="1">1 Gün</option>
                  <option value="7">7 Gün</option>
                  <option value="30">30 Gün</option>
                  <option value="90">90 Gün</option>
                  <option value="">Süresiz</option>
                </select>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateLink}
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Oluşturuluyor...' : 'Paylaşım Linki Oluştur'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Success Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <Check className="w-5 h-5" />
                  <span>Paylaşım linki başarıyla oluşturuldu!</span>
                </div>
              </div>

              {/* Share Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paylaşım Linki
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/share/${shareLink.share_token}`}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                    }`}
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Link Info */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2 text-sm">
                {formData.expiresInDays && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Geçerlilik Süresi:</span>
                    <span className="font-medium">{formData.expiresInDays} Gün</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Görüntülenme:</span>
                  <span className="font-medium">{shareLink.view_count} kez</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Kapat
                </button>
                <a
                  href={`/share/${shareLink.share_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors font-medium text-center"
                >
                  Linki Aç
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
