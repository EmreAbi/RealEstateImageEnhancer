import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ImageGallery from '../components/ImageGallery'
import UploadModal from '../components/UploadModal'
import { useImages } from '../contexts/ImageContext'

export default function Dashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { selectedFolder } = useImages()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onUpload={() => setShowUploadModal(true)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          <ImageGallery />
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  )
}
