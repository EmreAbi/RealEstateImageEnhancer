import { useState } from 'react'
import { useImages } from '../contexts/ImageContext'
import { useAuth } from '../contexts/AuthContext'
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Sparkles,
  LayoutGrid,
  List,
  X,
  Trash2,
  MoreVertical,
  Cpu,
  Check
} from 'lucide-react'

export default function Sidebar({ isOpen, onClose }) {
  const {
    folders,
    selectedFolder,
    setSelectedFolder,
    addFolder,
    deleteFolder,
    images,
    aiModels,
    selectedAIModel,
    setSelectedAIModel,
    viewMode,
    setViewMode
  } = useImages()

  const { profile } = useAuth()

  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderMenuOpen, setFolderMenuOpen] = useState(null)
  const [showAIModels, setShowAIModels] = useState(false)

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      try {
        await addFolder(newFolderName.trim())
        setNewFolderName('')
        setShowNewFolderInput(false)
      } catch (error) {
        alert('Klasör oluşturulurken hata: ' + error.message)
      }
    }
  }

  const handleDeleteFolder = async (e, folderId) => {
    e.stopPropagation()
    if (confirm('Bu klasörü ve içindeki tüm görselleri silmek istediğinize emin misiniz?')) {
      try {
        await deleteFolder(folderId)
        setFolderMenuOpen(null)
      } catch (error) {
        alert('Klasör silinirken hata: ' + error.message)
      }
    }
  }

  const getFolderCount = (folderId) => {
    return images.filter(img => img.folder_id === folderId).length
  }

  const selectedModel = aiModels.find(m => m.id === selectedAIModel)

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          fixed lg:static inset-y-0 left-0 z-30
          w-80 bg-white border-r border-gray-200
          flex flex-col transition-transform duration-300 ease-in-out
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Image Enhancer</h2>
                <p className="text-xs text-gray-500">AI Powered</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all
                ${viewMode === 'grid'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm font-medium">Izgara</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`
                flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all
                ${viewMode === 'list'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Liste</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {/* AI Model Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                AI Model
              </h3>
              <button
                onClick={() => setShowAIModels(!showAIModels)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Model Seç"
              >
                <Cpu className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Selected AI Model */}
            <button
              onClick={() => setShowAIModels(!showAIModels)}
              className="w-full p-3 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedModel?.display_name || 'Model Seçin'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {selectedModel?.provider || 'Provider'}
                  </p>
                </div>
              </div>
            </button>

            {/* AI Models Dropdown */}
            {showAIModels && aiModels.length > 0 && (
              <div className="mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                {aiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedAIModel(model.id)
                      setShowAIModels(false)
                    }}
                    className={`
                      w-full p-3 rounded-lg transition-all mb-1 last:mb-0
                      ${selectedAIModel === model.id
                        ? 'bg-purple-50 border border-purple-200'
                        : 'hover:bg-gray-50 border border-transparent'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {selectedAIModel === model.id && (
                        <Check className="w-4 h-4 text-purple-600" />
                      )}
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {model.display_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {model.description || model.provider}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Folders Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Klasörler
              </h3>
              <button
                onClick={() => setShowNewFolderInput(!showNewFolderInput)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Yeni Klasör"
              >
                <FolderPlus className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* New Folder Input */}
            {showNewFolderInput && (
              <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="Klasör adı..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFolder}
                    className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Oluştur
                  </button>
                  <button
                    onClick={() => {
                      setShowNewFolderInput(false)
                      setNewFolderName('')
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* All Images */}
            <button
              onClick={() => setSelectedFolder(null)}
              className={`
                w-full sidebar-item mb-2
                ${!selectedFolder ? 'sidebar-item-active' : 'sidebar-item-inactive'}
              `}
            >
              <ImageIcon className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">Tüm Görseller</span>
              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                {images.length}
              </span>
            </button>

            {/* Folder List */}
            <div className="space-y-1">
              {folders.map((folder) => (
                <div key={folder.id} className="relative group">
                  <button
                    onClick={() => setSelectedFolder(folder)}
                    className={`
                      w-full sidebar-item
                      ${selectedFolder?.id === folder.id ? 'sidebar-item-active' : 'sidebar-item-inactive'}
                    `}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: folder.color }}
                    />
                    <Folder className="w-5 h-5" />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                      {getFolderCount(folder.id)}
                    </span>
                  </button>

                  {/* Folder Menu */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setFolderMenuOpen(folderMenuOpen === folder.id ? null : folder.id)
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>

                    {folderMenuOpen === folder.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                        <button
                          onClick={(e) => handleDeleteFolder(e, folder.id)}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Sil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.username || 'User'}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {profile?.real_estate_office || 'Real Estate Office'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
