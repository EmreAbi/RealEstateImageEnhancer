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

/**
 * Invoke the edge function that enhances an image using OpenAI
 */
export const invokeImageEnhancement = async ({ imageId, aiModelId, promptOverride }) => {
  console.log('🚀 invokeImageEnhancement called:', { imageId, aiModelId, hasPromptOverride: !!promptOverride })

  const { data, error } = await supabase.functions.invoke('enhance-image', {
    body: {
      imageId,
      aiModelId,
      ...(promptOverride ? { promptOverride } : {})
    }
  })

  if (error) {
    console.error('❌ enhance-image edge function error:', error)
    throw error
  }

  if (data?.error) {
    console.error('❌ enhance-image function returned error payload:', data)
    throw new Error(data.error)
  }

  console.log('✅ invokeImageEnhancement success:', data)
  return data
}

/**
 * Share Links Functions
 */

/**
 * Create a share link for an image
 */
export const createShareLink = async (imageId, options = {}) => {
  const { title, description, expiresInDays, password } = options

  // Generate random token
  const shareToken = Math.random().toString(36).substring(2, 14) + Math.random().toString(36).substring(2, 14)

  const linkData = {
    image_id: imageId,
    user_id: (await getCurrentUser())?.id,
    share_token: shareToken,
    title: title || null,
    description: description || null,
    expires_at: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null,
    password_hash: password || null, // TODO: Hash password properly
    is_active: true
  }

  const { data, error } = await supabase
    .from('share_links')
    .insert([linkData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all share links for a user
 */
export const getUserShareLinks = async (userId) => {
  const { data, error } = await supabase
    .from('share_links')
    .select(`
      *,
      images (
        name,
        original_url,
        enhanced_url
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get share link by token (public access)
 */
export const getShareLinkByToken = async (token) => {
  const { data, error } = await supabase
    .from('share_links')
    .select(`
      *,
      images (
        name,
        original_url,
        enhanced_url,
        file_size,
        created_at
      ),
      profiles (
        username,
        real_estate_office
      )
    `)
    .eq('share_token', token)
    .eq('is_active', true)
    .single()

  if (error) throw error

  // Check if expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error('Bu paylaşım linki süresi dolmuş')
  }

  // Increment view count
  await supabase
    .from('share_links')
    .update({ view_count: data.view_count + 1 })
    .eq('id', data.id)

  return data
}

/**
 * Delete share link
 */
export const deleteShareLink = async (linkId) => {
  const { error } = await supabase
    .from('share_links')
    .delete()
    .eq('id', linkId)

  if (error) throw error
}

/**
 * Toggle share link active status
 */
export const toggleShareLink = async (linkId, isActive) => {
  const { data, error } = await supabase
    .from('share_links')
    .update({ is_active: isActive })
    .eq('id', linkId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Credit System Functions
 */

/**
 * Get user's current credit balance
 */
export const getUserCredits = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('credits_remaining')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data?.credits_remaining || 0
}

/**
 * Check if user has enough credits
 */
export const hasEnoughCredits = async (userId, requiredCredits = 1.0) => {
  const balance = await getUserCredits(userId)
  return balance >= requiredCredits
}

/**
 * Deduct credits from user balance
 * Returns true if successful, false if insufficient credits
 */
export const deductCredits = async (userId, amount = 1.0) => {
  const { data, error } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: amount
  })

  if (error) {
    console.error('Error deducting credits:', error)
    throw error
  }

  return data // Returns boolean from the database function
}

/**
 * Refund credits to user balance (used when enhancement fails)
 */
export const refundCredits = async (userId, amount = 1.0) => {
  const { error } = await supabase.rpc('refund_user_credits', {
    p_user_id: userId,
    p_amount: amount
  })

  if (error) {
    console.error('Error refunding credits:', error)
    throw error
  }
}

/**
 * Get user's credit usage history
 */
export const getCreditHistory = async (userId, limit = 100) => {
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
    .not('cost_credits', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}
