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
  console.log('📁 getFolders called for userId:', userId)

  try {
    // Get token from localStorage directly
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
    const authData = localStorage.getItem(storageKey)

    if (!authData) {
      console.error('❌ No auth data in localStorage')
      throw new Error('No auth data')
    }

    const { access_token } = JSON.parse(authData)

    const fetchUrl = `${supabaseUrl}/rest/v1/folders?user_id=eq.${userId}&order=created_at.desc&select=*`

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ getFolders fetch failed:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ getFolders returned:', data?.length, 'folders')
    return data
  } catch (error) {
    console.error('❌ getFolders error:', error)
    throw error
  }
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
 * Get all images for a user with retry logic
 */
export const getUserImages = async (userId, retries = 3) => {
  console.log('🖼️  getUserImages called for userId:', userId)

  for (let attempt = 1; attempt <= retries; attempt++) {
    console.log(`🔄 Attempt ${attempt}/${retries}...`)

    try {
      let timeoutId
      let didTimeout = false

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          didTimeout = true
          console.warn('⏰ Query timeout triggered!')
          reject(new Error('Request timeout'))
        }, 10000) // Reduced to 10s timeout
      })

      const queryPromise = (async () => {
        console.log('🔍 Starting Supabase query...')
        console.log('📡 Supabase URL:', supabaseUrl)
        console.log('👤 Query userId:', userId)

        try {
          // Try using fetch directly as a workaround for hanging client
          console.log('🌐 Attempting direct REST API call...')

          // Get token from localStorage directly to avoid hanging getSession() call
          const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
          console.log('🔑 Looking for token in localStorage with key:', storageKey)

          const authData = localStorage.getItem(storageKey)
          if (!authData) {
            console.error('❌ No auth data in localStorage')
            throw new Error('No auth data')
          }

          const { access_token } = JSON.parse(authData)
          if (!access_token) {
            console.error('❌ No access token in stored data')
            throw new Error('No access token')
          }

          console.log('✅ Access token retrieved from localStorage, making fetch request...')

          const fetchUrl = `${supabaseUrl}/rest/v1/images?user_id=eq.${userId}&order=created_at.desc&select=*`
          console.log('📡 Fetch URL:', fetchUrl)

          const response = await fetch(fetchUrl, {
            method: 'GET',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          })

          console.log('📥 Fetch response received, status:', response.status)

          if (!response.ok) {
            const errorText = await response.text()
            console.error('❌ Fetch failed:', response.status, errorText)
            throw new Error(`HTTP ${response.status}: ${errorText}`)
          }

          const data = await response.json()
          console.log('✨ Query completed!')
          console.log('📊 Result data length:', data?.length)

          return { data, error: null }
        } catch (queryError) {
          console.error('💥 Query threw error:', queryError)
          throw queryError
        }
      })()

      console.log('🏁 Starting Promise.race...')
      const result = await Promise.race([queryPromise, timeoutPromise])
      console.log('🏁 Promise.race completed')

      clearTimeout(timeoutId)

      if (didTimeout) {
        throw new Error('Request timeout')
      }

      const { data, error } = result

      if (error) {
        console.error(`❌ getUserImages error (attempt ${attempt}/${retries}):`, error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)

        if (attempt === retries) {
          throw error
        }

        // Wait before retry (exponential backoff)
        console.log(`⏳ Waiting ${attempt}s before retry...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      console.log('✅ getUserImages returned:', data?.length, 'images')

      return data
    } catch (err) {
      console.error(`❌ getUserImages attempt ${attempt}/${retries} failed:`, err.message)
      console.error('Error stack:', err.stack)

      if (attempt === retries) {
        console.error('❌ All retries exhausted. Giving up.')
        throw err
      }

      // Wait before retry
      console.log(`⏳ Waiting ${attempt}s before retry...`)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw new Error('getUserImages failed after all retries')
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
  console.log('🤖 getAIModels called')

  try {
    // Get token from localStorage directly
    const storageKey = `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`
    const authData = localStorage.getItem(storageKey)

    if (!authData) {
      console.error('❌ No auth data in localStorage')
      throw new Error('No auth data')
    }

    const { access_token } = JSON.parse(authData)

    const fetchUrl = `${supabaseUrl}/rest/v1/ai_models?is_active=eq.true&order=created_at.asc&select=*`

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ getAIModels fetch failed:', response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ getAIModels returned:', data?.length, 'models')
    return data
  } catch (error) {
    console.error('❌ getAIModels error:', error)
    throw error
  }
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

  try {
    console.log('🔵 About to call supabase.functions.invoke("enhance-image")...')
    console.log('📦 Request body:', { imageId, aiModelId, promptOverride })
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔗 Expected edge function URL:', `${supabaseUrl}/functions/v1/enhance-image`)

    // Check if supabase client exists
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }
    console.log('✅ Supabase client exists')

    const invokePromise = supabase.functions.invoke('enhance-image', {
      body: {
        imageId,
        aiModelId,
        ...(promptOverride ? { promptOverride } : {})
      }
    })

    console.log('⏳ Waiting for edge function response...')

    // Add timeout to detect hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Edge function request timeout after 30 seconds')), 30000)
    )

    const result = await Promise.race([invokePromise, timeoutPromise])
    console.log('📥 Edge function response received:', result)

    const { data, error } = result

    if (error) {
      console.error('❌ enhance-image edge function error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        status: error.status,
        statusText: error.statusText
      })
      throw error
    }

    if (data?.error) {
      console.error('❌ enhance-image function returned error payload:', data)
      throw new Error(data.error)
    }

    console.log('✅ invokeImageEnhancement success:', data)
    return data
  } catch (err) {
    console.error('💥 invokeImageEnhancement exception:', err)
    console.error('Exception type:', err.constructor.name)
    console.error('Exception message:', err.message)
    console.error('Exception stack:', err.stack)
    throw err
  }
}

/**
 * Invoke the edge function that decorates a room using AI
 */
export const invokeRoomDecoration = async ({ imageId, aiModelId, promptOverride }) => {
  console.log('🪑 invokeRoomDecoration called:', { imageId, aiModelId, hasPromptOverride: !!promptOverride })

  try {
    console.log('🔵 About to call supabase.functions.invoke("decorate-room")...')
    console.log('📦 Request body:', { imageId, aiModelId, promptOverride })
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔗 Expected edge function URL:', `${supabaseUrl}/functions/v1/decorate-room`)

    // Check if supabase client exists
    if (!supabase) {
      throw new Error('Supabase client is not initialized')
    }
    console.log('✅ Supabase client exists')

    const invokePromise = supabase.functions.invoke('decorate-room', {
      body: {
        imageId,
        aiModelId,
        ...(promptOverride ? { promptOverride } : {})
      }
    })

    console.log('⏳ Waiting for edge function response...')

    // Add timeout to detect hanging requests
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Edge function request timeout after 30 seconds')), 30000)
    )

    const result = await Promise.race([invokePromise, timeoutPromise])
    console.log('📥 Edge function response received:', result)

    const { data, error } = result

    if (error) {
      console.error('❌ decorate-room edge function error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        status: error.status,
        statusText: error.statusText
      })
      throw error
    }

    if (data?.error) {
      console.error('❌ decorate-room function returned error payload:', data)
      throw new Error(data.error)
    }

    console.log('✅ invokeRoomDecoration success:', data)
    return data
  } catch (err) {
    console.error('💥 invokeRoomDecoration exception:', err)
    console.error('Exception type:', err.constructor.name)
    console.error('Exception message:', err.message)
    console.error('Exception stack:', err.stack)
    throw err
  }
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

/**
 * Watermark Functions
 */

/**
 * Add watermark to an image (client-side)
 */
export const addWatermark = async ({ imageId, position = 'bottom-right', opacity = 0.3, logoUrl, logoScale = 0.1 }) => {
  console.log('🎨 addWatermark called:', { imageId, position, opacity, logoUrl, logoScale })

  try {
    // Get image record
    const { data: imageRecord, error: imageError } = await supabase
      .from('images')
      .select('*')
      .eq('id', imageId)
      .single()

    if (imageError) throw imageError
    if (!imageRecord) throw new Error('Image not found')

    console.log('📸 Image record:', imageRecord)

    // Import watermark utility
    const { addWatermarkToImage } = await import('./watermark.js')

    // Use enhanced image if available, otherwise original
    const sourceUrl = imageRecord.enhanced_url || imageRecord.original_url

    console.log('🎨 Adding watermark client-side...')

    // Add watermark client-side
    const watermarkedBlob = await addWatermarkToImage(sourceUrl, logoUrl, {
      position,
      opacity,
      logoScale
    })

    console.log('✅ Watermark added, uploading to storage...')

    // Upload to Supabase Storage
    const watermarkedPath = `${imageRecord.user_id}/${imageRecord.folder_id}/watermarked-${crypto.randomUUID()}.png`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(watermarkedPath, watermarkedBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(watermarkedPath)

    console.log('📤 Uploaded to:', publicUrl)

    // Watermark settings
    const watermarkSettings = {
      position,
      opacity,
      logoUrl,
      appliedAt: new Date().toISOString()
    }

    // Update image record
    const { data: updatedImage, error: updateError } = await supabase
      .from('images')
      .update({
        watermarked_url: publicUrl,
        watermark_settings: watermarkSettings
      })
      .eq('id', imageId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Update error:', updateError)
      throw updateError
    }

    console.log('✅ addWatermark success:', updatedImage)

    return {
      image: updatedImage,
      watermarkedUrl: publicUrl,
      settings: watermarkSettings
    }
  } catch (error) {
    console.error('❌ addWatermark error:', error)
    throw error
  }
}
