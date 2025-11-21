/**
 * API Service Layer
 *
 * This file provides a mock API interface that will be replaced with
 * real Supabase calls in production. The structure is designed to make
 * the transition seamless.
 *
 * TODO: Replace mock functions with Supabase client calls
 */

// TODO: Import Supabase client
// import { supabase } from './supabase'

class ApiService {
  constructor() {
    this.mockMode = true // Set to false when using real API
  }

  // ========== AUTH ==========

  async login(username, password, realEstateOffice) {
    if (this.mockMode) {
      // Mock login
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now(),
            username,
            realEstateOffice,
            email: `${username}@${realEstateOffice.toLowerCase().replace(/\s/g, '')}.com`,
            profilePhoto: null,
            createdAt: new Date().toISOString(),
          })
        }, 500)
      })
    }

    // TODO: Real Supabase auth
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: username,
    //   password: password,
    // })
    // if (error) throw error
    // return data.user
  }

  async register(username, password, email, realEstateOffice) {
    if (this.mockMode) {
      // Mock registration
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: Date.now(),
            username,
            email,
            realEstateOffice,
            profilePhoto: null,
            createdAt: new Date().toISOString(),
          })
        }, 500)
      })
    }

    // TODO: Real Supabase auth
    // const { data, error } = await supabase.auth.signUp({
    //   email,
    //   password,
    //   options: {
    //     data: {
    //       username,
    //       realEstateOffice,
    //     }
    //   }
    // })
    // if (error) throw error
    // return data.user
  }

  async logout() {
    if (this.mockMode) {
      return Promise.resolve()
    }

    // TODO: Real Supabase auth
    // const { error } = await supabase.auth.signOut()
    // if (error) throw error
  }

  // ========== USER PROFILE ==========

  async updateProfile(userId, updates) {
    if (this.mockMode) {
      // Mock update
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ ...updates, id: userId })
        }, 500)
      })
    }

    // TODO: Real Supabase update
    // const { data, error } = await supabase
    //   .from('users')
    //   .update(updates)
    //   .eq('id', userId)
    //   .single()
    // if (error) throw error
    // return data
  }

  async uploadProfilePhoto(userId, file) {
    if (this.mockMode) {
      // Mock upload - return base64
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.readAsDataURL(file)
      })
    }

    // TODO: Real Supabase Storage upload
    // const fileExt = file.name.split('.').pop()
    // const fileName = `${userId}-${Date.now()}.${fileExt}`
    // const filePath = `profiles/${fileName}`
    //
    // const { error: uploadError } = await supabase.storage
    //   .from('avatars')
    //   .upload(filePath, file)
    //
    // if (uploadError) throw uploadError
    //
    // const { data: { publicUrl } } = supabase.storage
    //   .from('avatars')
    //   .getPublicUrl(filePath)
    //
    // return publicUrl
  }

  // ========== FOLDERS ==========

  async getFolders(userId) {
    if (this.mockMode) {
      // Return mock data from ImageContext
      return Promise.resolve([])
    }

    // TODO: Real Supabase query
    // const { data, error } = await supabase
    //   .from('folders')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false })
    // if (error) throw error
    // return data
  }

  async createFolder(userId, name, color) {
    if (this.mockMode) {
      return Promise.resolve({
        id: Date.now().toString(),
        name,
        color,
        userId,
        createdAt: new Date().toISOString(),
      })
    }

    // TODO: Real Supabase insert
    // const { data, error } = await supabase
    //   .from('folders')
    //   .insert({ user_id: userId, name, color })
    //   .single()
    // if (error) throw error
    // return data
  }

  async deleteFolder(folderId) {
    if (this.mockMode) {
      return Promise.resolve()
    }

    // TODO: Real Supabase delete
    // const { error } = await supabase
    //   .from('folders')
    //   .delete()
    //   .eq('id', folderId)
    // if (error) throw error
  }

  // ========== IMAGES ==========

  async getImages(userId, folderId = null) {
    if (this.mockMode) {
      return Promise.resolve([])
    }

    // TODO: Real Supabase query
    // let query = supabase
    //   .from('images')
    //   .select('*')
    //   .eq('user_id', userId)
    //
    // if (folderId) {
    //   query = query.eq('folder_id', folderId)
    // }
    //
    // const { data, error } = await query.order('created_at', { ascending: false })
    // if (error) throw error
    // return data
  }

  async uploadImage(userId, folderId, file) {
    if (this.mockMode) {
      // Mock upload
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({
            id: Date.now().toString(),
            userId,
            folderId,
            name: file.name,
            url: reader.result,
            size: file.size,
            status: 'original',
            createdAt: new Date().toISOString(),
          })
        }
        reader.readAsDataURL(file)
      })
    }

    // TODO: Real Supabase Storage upload
    // const fileExt = file.name.split('.').pop()
    // const fileName = `${userId}/${Date.now()}-${file.name}`
    // const filePath = `images/${fileName}`
    //
    // const { error: uploadError } = await supabase.storage
    //   .from('property-images')
    //   .upload(filePath, file)
    //
    // if (uploadError) throw uploadError
    //
    // const { data: { publicUrl } } = supabase.storage
    //   .from('property-images')
    //   .getPublicUrl(filePath)
    //
    // const { data, error } = await supabase
    //   .from('images')
    //   .insert({
    //     user_id: userId,
    //     folder_id: folderId,
    //     name: file.name,
    //     url: publicUrl,
    //     size: file.size,
    //     status: 'original'
    //   })
    //   .single()
    //
    // if (error) throw error
    // return data
  }

  async deleteImage(imageId) {
    if (this.mockMode) {
      return Promise.resolve()
    }

    // TODO: Real Supabase delete (also delete from storage)
    // const { data: image } = await supabase
    //   .from('images')
    //   .select('url')
    //   .eq('id', imageId)
    //   .single()
    //
    // if (image) {
    //   const filePath = image.url.split('/').slice(-2).join('/')
    //   await supabase.storage
    //     .from('property-images')
    //     .remove([filePath])
    // }
    //
    // const { error } = await supabase
    //   .from('images')
    //   .delete()
    //   .eq('id', imageId)
    //
    // if (error) throw error
  }

  async enhanceImage(imageId) {
    if (this.mockMode) {
      // Mock AI enhancement
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            id: imageId,
            status: 'enhanced',
            enhancedUrl: 'mock-enhanced-url',
          })
        }, 3000)
      })
    }

    // TODO: Real AI API call
    // const { data, error } = await supabase.functions.invoke('enhance-image', {
    //   body: { imageId }
    // })
    // if (error) throw error
    // return data
  }

  // ========== SETTINGS ==========

  async uploadCompanyLogo(userId, file) {
    if (this.mockMode) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve(reader.result)
        }
        reader.readAsDataURL(file)
      })
    }

    // TODO: Real Supabase Storage upload
    // Similar to profile photo upload
  }
}

export const api = new ApiService()
