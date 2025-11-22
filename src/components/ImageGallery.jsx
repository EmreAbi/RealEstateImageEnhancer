import { useEffect, useState } from 'react'
import { useImages } from '../contexts/ImageContext'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Download,
  Trash2,
  Check,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Calendar,
  HardDrive,
  X,
  SlidersHorizontal,
  Archive
} from 'lucide-react'
import ImageModal from './ImageModal'
import DashboardStats from './DashboardStats'
import JSZip from 'jszip'

export default function ImageGallery({ searchQuery = '' }) {
  const { t } = useLanguage()
  const {
    images,
    selectedFolder,
    selectedImages,
    viewMode,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    deleteImages,
    getImagesByFolder
  } = useImages()

  const [imageModal, setImageModal] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all', // all, original, processing, enhanced, failed
    dateRange: 'all', // all, today, week, month
    sortBy: 'newest' // newest, oldest, name
  })

  useEffect(() => {
    if (!imageModal) return

    const fresh = images.find(img => img.id === imageModal.id)
    if (fresh && fresh !== imageModal) {
      setImageModal(fresh)
    }

    if (!fresh) {
      setImageModal(null)
    }
  }, [images, imageModal])

  // Apply search and filters
  let displayImages = selectedFolder
    ? getImagesByFolder(selectedFolder.id)
    : images

  // Search filter
  if (searchQuery.trim()) {
    displayImages = displayImages.filter(img =>
      img.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Status filter
  if (filters.status !== 'all') {
    displayImages = displayImages.filter(img => img.status === filters.status)
  }

  // Date range filter
  if (filters.dateRange !== 'all') {
    const now = new Date()
    displayImages = displayImages.filter(img => {
      const imgDate = new Date(img.created_at)
      const diffTime = Math.abs(now - imgDate)
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (filters.dateRange === 'today') return diffDays <= 1
      if (filters.dateRange === 'week') return diffDays <= 7
      if (filters.dateRange === 'month') return diffDays <= 30
      return true
    })
  }

  // Sort
  displayImages = [...displayImages].sort((a, b) => {
    if (filters.sortBy === 'newest') {
      return new Date(b.created_at) - new Date(a.created_at)
    }
    if (filters.sortBy === 'oldest') {
      return new Date(a.created_at) - new Date(b.created_at)
    }
    if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  const handleSelectAll = () => {
    if (selectedImages.length === displayImages.length) {
      clearSelection()
    } else {
      selectAllImages(displayImages.map(img => img.id))
    }
  }

  const handleDelete = () => {
    if (selectedImages.length === 0) return
    if (confirm(t('images.deleteConfirm', { count: selectedImages.length }))) {
      deleteImages(selectedImages)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedImages.length === 0) return

    try {
      const zip = new JSZip()
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id))

      // Show progress
      let completed = 0
      const totalImages = selectedImagesData.length

      for (const image of selectedImagesData) {
        try {
          // Use enhanced URL if available, otherwise original
          const imageUrl = image.enhanced_url || image.original_url

          // Fetch image as blob
          const response = await fetch(imageUrl)
          const blob = await response.blob()

          // Add to zip with proper name
          const fileName = image.name
          zip.file(fileName, blob)

          completed++
          console.log(`Downloaded ${completed}/${totalImages}: ${fileName}`)
        } catch (error) {
          console.error(`Error downloading ${image.name}:`, error)
        }
      }

      // Generate and download ZIP
      console.log('Generating ZIP file...')
      const zipBlob = await zip.generateAsync({ type: 'blob' })

      // Create download link
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `images-${new Date().getTime()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('ZIP download complete!')
      clearSelection()
    } catch (error) {
      console.error('Error creating ZIP:', error)
      alert(t('images.zipError', { error: error.message }))
    }
  }

  const getStatusBadge = (status, image) => {
    const modelName = image?.metadata?.enhancement?.model
    const getModelIcon = (model) => {
      if (model?.includes('openai') || model?.includes('gpt-image')) return '🤖'
      if (model?.includes('fal-ai') || model?.includes('flux') || model?.includes('reve') || model?.includes('nano')) return '🎨'
      return ''
    }

    switch (status) {
      case 'original':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            <ImageIcon className="w-3 h-3" />
            {t('images.original')}
          </span>
        )
      case 'processing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3 animate-spin" />
            {t('images.processing')}
          </span>
        )
      case 'enhanced':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full" title={modelName || 'AI İyileştirildi'}>
            <Sparkles className="w-3 h-3" />
            {modelName && <span>{getModelIcon(modelName)}</span>}
            {t('images.enhanced')}
          </span>
        )
      case 'failed':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {t('images.failed')}
          </span>
        )
      default:
        return null
    }
  }

  if (displayImages.length === 0) {
    return (
      <div className="p-6">
        {!selectedFolder && <DashboardStats />}

        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ImageIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || filters.status !== 'all' || filters.dateRange !== 'all'
              ? t('images.noResults')
              : t('dashboard.noImages')
            }
          </h3>
          <p className="text-gray-600 mb-6 max-w-md">
            {searchQuery || filters.status !== 'all' || filters.dateRange !== 'all'
              ? t('images.noResultsMessage')
              : selectedFolder
                ? t('dashboard.noImagesInFolder')
                : t('dashboard.getStarted')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Dashboard Stats - Only show when viewing all images */}
      {!selectedFolder && <DashboardStats />}

      {/* Filters Bar */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showFilters || filters.status !== 'all' || filters.dateRange !== 'all' || filters.sortBy !== 'newest'
              ? 'bg-primary-100 text-primary-700 border border-primary-300'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">{t('images.filter')}</span>
        </button>

        {/* Active Filters Display */}
        {(filters.status !== 'all' || filters.dateRange !== 'all' || filters.sortBy !== 'newest') && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {t('images.filterStatus')}: {filters.status === 'original' ? t('images.original') :
                       filters.status === 'enhanced' ? t('images.enhanced') :
                       filters.status === 'processing' ? t('images.processing') : t('images.failed')}
                <button onClick={() => setFilters({...filters, status: 'all'})} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.dateRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                {t('images.filterDate')}: {filters.dateRange === 'today' ? t('images.filterToday') :
                       filters.dateRange === 'week' ? t('images.filterWeek') : t('images.filterMonth')}
                <button onClick={() => setFilters({...filters, dateRange: 'all'})} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.sortBy !== 'newest' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                {t('images.filterSort')}: {filters.sortBy === 'oldest' ? t('images.filterOldest') : t('images.filterByName')}
                <button onClick={() => setFilters({...filters, sortBy: 'newest'})} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => setFilters({ status: 'all', dateRange: 'all', sortBy: 'newest' })}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {t('images.clearAllFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-6 card p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('images.filterStatus')}</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">{t('images.filterAll')}</option>
                <option value="original">{t('images.original')}</option>
                <option value="processing">{t('images.processing')}</option>
                <option value="enhanced">{t('images.enhanced')}</option>
                <option value="failed">{t('images.failed')}</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('images.filterDate')}</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="all">{t('images.filterAllTime')}</option>
                <option value="today">{t('images.filterToday')}</option>
                <option value="week">{t('images.filterWeek')}</option>
                <option value="month">{t('images.filterMonth')}</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('images.filterSort')}</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="newest">{t('images.filterNewest')}</option>
                <option value="oldest">{t('images.filterOldest')}</option>
                <option value="name">{t('images.filterByName')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedFolder ? selectedFolder.name : t('images.allImages')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {displayImages.length} {t('images.imagesLabel')}
              {searchQuery && ` - "${searchQuery}" ${t('images.resultsFor')}`}
            </p>
          </div>

          {/* Action Buttons */}
          {selectedImages.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                title={t('images.zipDownload')}
              >
                <Archive className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.download')} ({selectedImages.length})</span>
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">{t('common.delete')} ({selectedImages.length})</span>
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          )}
        </div>

        {/* Select All */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {selectedImages.length === displayImages.length ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {t('images.clearSelection')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t('images.selectAll')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayImages.map((image) => (
            <div
              key={image.id}
              className={`
                card overflow-hidden cursor-pointer group relative
                ${selectedImages.includes(image.id) ? 'ring-2 ring-primary-500' : ''}
              `}
              onClick={() => toggleImageSelection(image.id)}
            >
              {/* Selection Checkbox */}
              <div className="absolute top-3 left-3 z-10">
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${selectedImages.includes(image.id)
                      ? 'bg-primary-600 border-primary-600'
                      : 'bg-white border-white group-hover:border-primary-300'
                    }
                  `}
                >
                  {selectedImages.includes(image.id) && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                {getStatusBadge(image.status, image)}
              </div>

              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img
                  src={image.enhanced_url || image.original_url}
                  alt={image.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageModal(image)
                  }}
                />
              </div>

              {/* Image Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-2">
                  {image.name}
                </h3>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(image.created_at).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setImageModal(image)
                  }}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  title="Görüntüle"
                >
                  <ImageIcon className="w-5 h-5 text-gray-700" />
                </button>
                <a
                  href={image.enhanced_url || image.original_url}
                  download={image.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                  title="İndir"
                >
                  <Download className="w-5 h-5 text-gray-700" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedImages.length === displayImages.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('images.image')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('images.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('images.size')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('images.date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('images.operations')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayImages.map((image) => (
                <tr
                  key={image.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedImages.includes(image.id) ? 'bg-primary-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={image.enhanced_url || image.original_url}
                        alt={image.name}
                        className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                        onClick={() => setImageModal(image)}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{image.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(image.status, image)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {image.file_size ? `${(image.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(image.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setImageModal(image)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Görüntüle"
                      >
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      <a
                        href={image.enhanced_url || image.original_url}
                        download={image.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="İndir"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <ImageModal
          image={imageModal}
          onClose={() => setImageModal(null)}
        />
      )}
    </div>
  )
}
