import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔧 Supabase Config:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING'
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[EXISTS]' : '[MISSING]')
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

console.log('✅ Supabase client created successfully')

// Helper functions for common operations

/**
 * Get current user session
 */
export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

/**
 * Sign in with email and password
 */
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) throw error
  return data
}

/**
 * Sign up with email and password
 */
export const signUp = async (email, password, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  })

  if (error) throw error
  return data
}

/**
 * Sign out
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Upload image to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - User ID
 * @param {string} folderId - Folder ID
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export const uploadImage = async (file, userId, folderId) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${userId}/${folderId}/${fileName}`

  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath)

  return { path: data.path, url: publicUrl }
}

/**
 * Delete image from Supabase Storage
 */
export const deleteImageFromStorage = async (filePath) => {
  const { error } = await supabase.storage
    .from('images')
    .remove([filePath])

  if (error) throw error
}

/**
 * Get all folders for a user
 */
export const getFolders = async (userId) => {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Create a new folder
 */
export const createFolder = async (userId, name, color = '#0ea5e9') => {
  console.log('📁 createFolder called:', { userId, name, color })

  try {
    // Test: Check if table exists
    console.log('🔍 Testing table access...')
    const { data: testData, error: testError } = await supabase
      .from('folders')
      .select('count')
      .limit(1)

    console.log('Test query result:', { testData, testError })

    if (testError) {
      console.error('❌ Table access failed:', testError)
      throw new Error(`Table access error: ${testError.message}`)
    }

    console.log('✅ Table exists, attempting insert...')

    const { data, error } = await supabase
      .from('folders')
      .insert([{ user_id: userId, name, color }])
      .select()
      .single()

    if (error) {
      console.error('❌ Supabase createFolder error:', error)
      console.error('Error code:', error.code)
      console.error('Error details:', error.details)
      console.error('Error hint:', error.hint)
      throw error
    }

    console.log('✅ Folder created in DB:', data)
    return data
  } catch (err) {
    console.error('❌ createFolder exception:', err)
    throw err
  }
}

/**
 * Delete a folder
 */
export const deleteFolder = async (folderId) => {
  const { error } = await supabase
    .from('folders')
    .delete()
    .eq('id', folderId)

  if (error) throw error
}

/**
 * Get images by folder
 */
export const getImagesByFolder = async (folderId) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('folder_id', folderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get all images for a user
 */
export const getUserImages = async (userId) => {
  console.log('🖼️  getUserImages called for userId:', userId)

  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ getUserImages error:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    throw error
  }

  console.log('✅ getUserImages returned:', data?.length, 'images')
  console.log('📊 Raw data:', data)

  return data
}

/**
 * Create image record in database
 */
export const createImageRecord = async (imageData) => {
  console.log('💾 createImageRecord called:', imageData)

  const { data, error } = await supabase
    .from('images')
    .insert([imageData])
    .select()
    .single()

  if (error) {
    console.error('❌ createImageRecord error:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    throw error
  }

  console.log('✅ Image record created:', data)
  return data
}

/**
 * Update image record
 */
export const updateImageRecord = async (imageId, updates) => {
  const { data, error } = await supabase
    .from('images')
    .update(updates)
    .eq('id', imageId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete image record from database
 */
export const deleteImageRecord = async (imageId) => {
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)

  if (error) throw error
}

/**
 * Get all active AI models
 */
export const getAIModels = async () => {
  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Create enhancement log
 */
export const createEnhancementLog = async (logData) => {
  const { data, error } = await supabase
    .from('enhancement_logs')
    .insert([logData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update enhancement log
 */
export const updateEnhancementLog = async (logId, updates) => {
  const { data, error } = await supabase
    .from('enhancement_logs')
    .update(updates)
    .eq('id', logId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get enhancement logs for an image
 */
export const getImageEnhancementLogs = async (imageId) => {
  const { data, error } = await supabase
    .from('enhancement_logs')
    .select(`
      *,
      ai_models (
        name,
        display_name,
        provider
      )
    `)
    .eq('image_id', imageId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get user's enhancement history
 */
export const getUserEnhancementHistory = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('enhancement_logs')
    .select(`
      *,
      images (
        name,
        original_url
      ),
      ai_models (
        display_name,
        provider
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
