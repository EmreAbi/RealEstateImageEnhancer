import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getFolders,
  createFolder as createFolderDB,
  deleteFolder as deleteFolderDB,
  getUserImages,
  getImagesByFolder as getImagesByFolderDB,
  createImageRecord,
  updateImageRecord,
  deleteImageRecord,
  uploadImage,
  deleteImageFromStorage,
  getAIModels,
  createEnhancementLog,
  updateEnhancementLog
} from '../lib/supabase'

const ImageContext = createContext(null)

export const useImages = () => {
  const context = useContext(ImageContext)
  if (!context) {
    throw new Error('useImages must be used within an ImageProvider')
  }
  return context
}

export const ImageProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [folders, setFolders] = useState([])
  const [images, setImages] = useState([])
  const [aiModels, setAiModels] = useState([])
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [selectedAIModel, setSelectedAIModel] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [loading, setLoading] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Load data function wrapped in useCallback to ensure stable reference
  const loadData = useCallback(async () => {
    if (!user?.id) {
      console.log('⚠️ loadData called without user, skipping...')
      return
    }

    console.log('🔄 Loading data for user:', user.id)
    try {
      setLoading(true)
      console.log('🟡 Fetching data from Supabase...')
      const [foldersData, imagesData, modelsData] = await Promise.all([
        getFolders(user.id),
        getUserImages(user.id),
        getAIModels()
      ])

      console.log('✅ Data fetched:', {
        folders: foldersData?.length,
        images: imagesData?.length,
        models: modelsData?.length
      })
      console.log('📁 Folders data:', foldersData)

      setFolders(foldersData || [])
      setImages(imagesData || [])
      setAiModels(modelsData || [])

      console.log('✅ State updated with fetched data')

      // Set default AI model
      if (modelsData && modelsData.length > 0 && !selectedAIModel) {
        setSelectedAIModel(modelsData[0].id)
        console.log('✅ Default AI model set:', modelsData[0].display_name)
      }
    } catch (error) {
      console.error('❌ Error loading data:', error)
      console.error('Error details:', error.message)
    } finally {
      setLoading(false)
    }
  }, [user, selectedAIModel])

  // Load folders and images when user changes
  useEffect(() => {
    console.log('🔄 ImageContext useEffect triggered', {
      userId: user?.id || 'NO USER',
      authLoading,
      hasInitialized
    })

    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...')
      return
    }

    if (user?.id) {
      console.log('✅ User exists, loading data...')
      loadData()
      if (!hasInitialized) {
        setHasInitialized(true)
      }
    } else if (hasInitialized) {
      // Only reset state if we had initialized before (user logged out)
      // Don't reset during initial page load
      console.log('⚠️ User logged out, resetting state...')
      setFolders([])
      setImages([])
      setAiModels([])
      setSelectedFolder(null)
      setSelectedImages([])
      setSelectedAIModel(null)
      setHasInitialized(false)
    } else {
      console.log('⏸️ No user and not initialized yet, skipping...')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, loadData])

  const addFolder = async (name, color = '#0ea5e9') => {
    console.log('🟢 addFolder called with:', { name, color, userId: user?.id })
    try {
      if (!user?.id) {
        console.error('❌ User not authenticated:', user)
        throw new Error('User not authenticated')
      }

      console.log('🟡 Creating folder in database...')
      const newFolder = await createFolderDB(user.id, name, color)
      console.log('✅ Folder created:', newFolder)

      setFolders([...folders, { ...newFolder, image_count: 0 }])
      console.log('✅ Folders state updated')
      return newFolder
    } catch (error) {
      console.error('❌ Error creating folder:', error)
      console.error('Error details:', error.message, error.stack)
      throw error
    }
  }

  const deleteFolder = async (folderId) => {
    try {
      await deleteFolderDB(folderId)
      setFolders(folders.filter(f => f.id !== folderId))
      setImages(images.filter(img => img.folder_id !== folderId))
      if (selectedFolder?.id === folderId) {
        setSelectedFolder(null)
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      throw error
    }
  }

  const uploadImages = async (files, folderId) => {
    console.log('📤 uploadImages called:', { filesCount: files.length, folderId, userId: user?.id })
    try {
      if (!user?.id) {
        console.error('❌ User not authenticated')
        throw new Error('User not authenticated')
      }

      const targetFolderId = folderId || selectedFolder?.id || folders[0]?.id
      console.log('📁 Target folder:', targetFolderId)

      if (!targetFolderId) {
        console.error('❌ No folder selected')
        throw new Error('No folder selected')
      }

      console.log('🔄 Uploading', files.length, 'files...')

      const uploadPromises = Array.from(files).map(async (file, index) => {
        console.log(`📷 [${index + 1}/${files.length}] Uploading:`, file.name)

        // Upload to storage
        const { path, url } = await uploadImage(file, user.id, targetFolderId)
        console.log(`✅ [${index + 1}] Storage upload done:`, url)

        // Create database record
        const imageData = {
          user_id: user.id,
          folder_id: targetFolderId,
          name: file.name,
          original_url: url,
          file_size: file.size,
          mime_type: file.type,
          status: 'original',
          metadata: {}
        }

        console.log(`💾 [${index + 1}] Creating DB record...`, imageData)
        const dbRecord = await createImageRecord(imageData)
        console.log(`✅ [${index + 1}] DB record created:`, dbRecord)

        return dbRecord
      })

      const newImages = await Promise.all(uploadPromises)
      console.log('✅ All images uploaded:', newImages.length)

      // Refresh all data to ensure UI is up to date
      console.log('🔄 Refreshing all data after upload...')
      await loadData()
      console.log('✅ Data refreshed after upload')

      return newImages
    } catch (error) {
      console.error('❌ Error uploading images:', error)
      console.error('Error stack:', error.stack)
      throw error
    }
  }

  const deleteImages = async (imageIds) => {
    try {
      const deletedImages = images.filter(img => imageIds.includes(img.id))

      // Delete from database and storage
      await Promise.all(
        deletedImages.map(async (img) => {
          // Delete from database
          await deleteImageRecord(img.id)

          // Delete from storage (extract path from URL)
          if (img.original_url) {
            const pathMatch = img.original_url.match(/\/images\/(.+)$/)
            if (pathMatch) {
              await deleteImageFromStorage(pathMatch[1])
            }
          }

          // Delete enhanced image if exists
          if (img.enhanced_url) {
            const pathMatch = img.enhanced_url.match(/\/images\/(.+)$/)
            if (pathMatch) {
              await deleteImageFromStorage(pathMatch[1])
            }
          }
        })
      )

      setImages(images.filter(img => !imageIds.includes(img.id)))
      setSelectedImages(selectedImages.filter(id => !imageIds.includes(id)))

      // Refresh folders to update counts
      const updatedFolders = await getFolders(user.id)
      setFolders(updatedFolders)
    } catch (error) {
      console.error('Error deleting images:', error)
      throw error
    }
  }

  const enhanceImages = async (imageIds, modelId) => {
    try {
      if (!user?.id) throw new Error('User not authenticated')

      const aiModelId = modelId || selectedAIModel
      if (!aiModelId) throw new Error('No AI model selected')

      // Update images to processing status
      const updatedImages = await Promise.all(
        imageIds.map(async (id) => {
          const updated = await updateImageRecord(id, { status: 'processing' })
          return updated
        })
      )

      setImages(prevImages =>
        prevImages.map(img => {
          const updated = updatedImages.find(u => u.id === img.id)
          return updated || img
        })
      )

      // Create enhancement logs for each image
      const enhancementPromises = imageIds.map(async (imageId) => {
        const log = await createEnhancementLog({
          user_id: user.id,
          image_id: imageId,
          ai_model_id: aiModelId,
          status: 'pending',
          parameters: {}
        })

        // Here you would call your actual AI API
        // For now, we'll simulate it
        // TODO: Implement actual AI enhancement call

        return log
      })

      await Promise.all(enhancementPromises)

      // Simulate AI processing (replace with actual API call)
      setTimeout(async () => {
        await Promise.all(
          imageIds.map(async (id) => {
            await updateImageRecord(id, { status: 'enhanced' })
          })
        )

        // Reload images
        const updatedImages = await getUserImages(user.id)
        setImages(updatedImages)
      }, 3000)
    } catch (error) {
      console.error('Error enhancing images:', error)

      // Update failed images
      await Promise.all(
        imageIds.map(async (id) => {
          await updateImageRecord(id, { status: 'failed' })
        })
      )

      throw error
    }
  }

  const getImagesByFolder = (folderId) => {
    if (!folderId) return images
    return images.filter(img => img.folder_id === folderId)
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
    aiModels,
    selectedFolder,
    selectedImages,
    selectedAIModel,
    viewMode,
    loading,
    setSelectedFolder,
    setSelectedAIModel,
    setViewMode,
    addFolder,
    deleteFolder,
    uploadImages,
    deleteImages,
    enhanceImages,
    getImagesByFolder,
    toggleImageSelection,
    selectAllImages,
    clearSelection,
    refreshData: loadData
  }

  return <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
}
