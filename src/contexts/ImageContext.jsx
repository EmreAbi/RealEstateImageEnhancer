import { createContext, useContext, useState, useEffect } from 'react'

const ImageContext = createContext(null)

export const useImages = () => {
  const context = useContext(ImageContext)
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider')
  }
  return context
}

// Dummy data for demonstration
const DUMMY_FOLDERS = [
  { id: '1', name: 'Lüks Villalar', count: 24, color: '#0ea5e9' },
  { id: '2', name: 'Modern Apartmanlar', count: 18, color: '#8b5cf6' },
  { id: '3', name: 'Ticari Alanlar', count: 12, color: '#f59e0b' },
  { id: '4', name: 'Ofisler', count: 9, color: '#10b981' },
  { id: '5', name: 'Stüdyo Daireler', count: 15, color: '#ec4899' },
]

const DUMMY_IMAGES = [
  {
    id: '1',
    folderId: '1',
    name: 'villa-bahce.jpg',
    url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
    uploadedAt: new Date('2024-11-15').toISOString(),
    status: 'original',
    size: '2.4 MB'
  },
  {
    id: '2',
    folderId: '1',
    name: 'villa-dis-cephe.jpg',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    uploadedAt: new Date('2024-11-15').toISOString(),
    status: 'enhanced',
    size: '3.1 MB'
  },
  {
    id: '3',
    folderId: '2',
    name: 'modern-salon.jpg',
    url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
    uploadedAt: new Date('2024-11-16').toISOString(),
    status: 'original',
    size: '1.8 MB'
  },
  {
    id: '4',
    folderId: '2',
    name: 'mutfak-tasarim.jpg',
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800',
    uploadedAt: new Date('2024-11-16').toISOString(),
    status: 'processing',
    size: '2.2 MB'
  },
  {
    id: '5',
    folderId: '1',
    name: 'villa-havuz.jpg',
    url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    uploadedAt: new Date('2024-11-17').toISOString(),
    status: 'enhanced',
    size: '2.9 MB'
  },
  {
    id: '6',
    folderId: '3',
    name: 'ofis-binasi.jpg',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    uploadedAt: new Date('2024-11-17').toISOString(),
    status: 'original',
    size: '3.5 MB'
  },
  {
    id: '7',
    folderId: '2',
    name: 'balkon-manzara.jpg',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    uploadedAt: new Date('2024-11-18').toISOString(),
    status: 'original',
    size: '2.1 MB'
  },
  {
    id: '8',
    folderId: '4',
    name: 'toplanti-odasi.jpg',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
    uploadedAt: new Date('2024-11-18').toISOString(),
    status: 'enhanced',
    size: '1.9 MB'
  }
]

export const ImageProvider = ({ children }) => {
  const [folders, setFolders] = useState(DUMMY_FOLDERS)
  const [images, setImages] = useState(DUMMY_IMAGES)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [viewMode, setViewMode] = useState('grid') // grid or list

  const addFolder = (name, color = '#0ea5e9') => {
    const newFolder = {
      id: Date.now().toString(),
      name,
      count: 0,
      color
    }
    setFolders([...folders, newFolder])
    return newFolder
  }

  const deleteFolder = (folderId) => {
    setFolders(folders.filter(f => f.id !== folderId))
    setImages(images.filter(img => img.folderId !== folderId))
    if (selectedFolder?.id === folderId) {
      setSelectedFolder(null)
    }
  }

  const uploadImages = (files, folderId) => {
    const newImages = Array.from(files).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      folderId: folderId || selectedFolder?.id || folders[0]?.id,
      name: file.name,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
      status: 'original',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    }))

    setImages([...images, ...newImages])

    // Update folder count
    const targetFolderId = folderId || selectedFolder?.id || folders[0]?.id
    setFolders(folders.map(f =>
      f.id === targetFolderId
        ? { ...f, count: f.count + newImages.length }
        : f
    ))

    return newImages
  }

  const deleteImages = (imageIds) => {
    const deletedImages = images.filter(img => imageIds.includes(img.id))

    setImages(images.filter(img => !imageIds.includes(img.id)))
    setSelectedImages(selectedImages.filter(id => !imageIds.includes(id)))

    // Update folder counts
    const folderCounts = {}
    deletedImages.forEach(img => {
      folderCounts[img.folderId] = (folderCounts[img.folderId] || 0) + 1
    })

    setFolders(folders.map(f =>
      folderCounts[f.id]
        ? { ...f, count: Math.max(0, f.count - folderCounts[f.id]) }
        : f
    ))
  }

  const enhanceImages = async (imageIds) => {
    // Simulate AI processing
    imageIds.forEach(id => {
      setImages(prevImages =>
        prevImages.map(img =>
          img.id === id ? { ...img, status: 'processing' } : img
        )
      )
    })

    // Simulate processing delay
    setTimeout(() => {
      setImages(prevImages =>
        prevImages.map(img =>
          imageIds.includes(img.id) ? { ...img, status: 'enhanced' } : img
        )
      )
    }, 3000)
  }

  const getImagesByFolder = (folderId) => {
    if (!folderId) return images
    return images.filter(img => img.folderId === folderId)
  }

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const selectAllImages = (imageIds) => {
    setSelectedImages(imageIds)
  }

  const clearSelection = () => {
    setSelectedImages([])
  }

  const value = {
    folders,
    images,
    selectedFolder,
    selectedImages,
    viewMode,
    setSelectedFolder,
    setViewMode,
    addFolder,
    deleteFolder,
    uploadImages,
    deleteImages,
    enhanceImages,
    getImagesByFolder,
    toggleImageSelection,
    selectAllImages,
    clearSelection
  }

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
}
