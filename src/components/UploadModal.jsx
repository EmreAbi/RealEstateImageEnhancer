import { useState, useRef } from 'react'
import { useImages } from '../contexts/ImageContext'
import { X, Upload, FolderOpen, Image as ImageIcon, Check, AlertCircle } from 'lucide-react'

export default function UploadModal({ onClose }) {
  const { folders, selectedFolder, uploadImages } = useImages()
  const [selectedFolderId, setSelectedFolderId] = useState(selectedFolder?.id || folders[0]?.id)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    const imageFiles = Array.from(fileList).filter(file =>
      file.type.startsWith('image/')
    )
    setFiles(prev => [...prev, ...imageFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0 || !selectedFolderId) return

    setUploading(true)
    setError(null)
    try {
      await uploadImages(files, selectedFolderId)
      // Success - close modal after a brief delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      console.error('Upload failed:', error)
      setError(
        error.message ||
        'Görseller yüklenirken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.'
      )
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 p-2 rounded-lg">
              <Upload className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Görsel Yükle</h2>
              <p className="text-sm text-gray-600">Birden fazla görsel yükleyebilirsiniz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Folder Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Klasör Seçin
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name} ({folder.count} görsel)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all
              ${dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />

            <div className="flex flex-col items-center">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
                ${dragActive ? 'bg-primary-100' : 'bg-gray-100'}
              `}>
                <Upload className={`w-8 h-8 ${dragActive ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>

              <p className="text-lg font-semibold text-gray-900 mb-2">
                Görselleri Sürükleyip Bırakın
              </p>
              <p className="text-sm text-gray-600 mb-4">
                veya
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Dosya Seç
              </button>
              <p className="text-xs text-gray-500 mt-4">
                PNG, JPG, JPEG, WebP (Maks. 10MB)
              </p>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Seçilen Görseller ({files.length})
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">Yükleme Hatası</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="p-1 hover:bg-red-100 rounded transition-colors"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={uploading}
          >
            İptal
          </button>
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || !selectedFolderId || uploading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
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
                Yükleniyor...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Yükle ({files.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
