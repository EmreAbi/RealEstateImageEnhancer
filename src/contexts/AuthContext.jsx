import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, signIn, signUp, signOut, getUserProfile } from '../lib/supabase'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 AuthContext initializing...')
    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Session check result:', session ? 'Session exists' : 'No session')

        if (session?.user) {
          console.log('✅ User found in session:', session.user.id)
          setUser(session.user)
          // Load user profile
          const userProfile = await getUserProfile(session.user.id)
          setProfile(userProfile)
          console.log('✅ Profile loaded')
        } else {
          console.log('⚠️ No user in session')
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
      } finally {
        setLoading(false)
        console.log('✅ Auth initialization complete, loading:', false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session ? 'Has session' : 'No session')
        if (session?.user) {
          console.log('✅ Setting user:', session.user.id)
          setUser(session.user)
          try {
            const userProfile = await getUserProfile(session.user.id)
            setProfile(userProfile)
          } catch (error) {
            console.error('Error loading profile:', error)
          }
        } else {
          console.log('⚠️ Clearing user state')
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    try {
      const { user: authUser, session } = await signIn(email, password)

      if (authUser) {
        const userProfile = await getUserProfile(authUser.id)
        setUser(authUser)
        setProfile(userProfile)
        return { user: authUser, profile: userProfile }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email, password, username, realEstateOffice) => {
    try {
      const { data, error } = await signUp(email, password, {
        username,
        real_estate_office: realEstateOffice
      })

      if (error) throw error

      if (data?.user) {
        // Profile is automatically created by database trigger
        // Wait a bit for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Fetch the created profile
        try {
          const userProfile = await getUserProfile(data.user.id)
          setUser(data.user)
          setProfile(userProfile)
          return { user: data.user, profile: userProfile }
        } catch (profileError) {
          // Profile might not be created yet, that's okay
          // User can still proceed, profile will load on next login
          console.warn('Profile not loaded immediately:', profileError)
          setUser(data.user)
          return { user: data.user, profile: null }
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut()
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Logout error:', error)
      throw error
    }
  }

  const updateProfile = async (updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return data
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  const updateProfilePhoto = async (file) => {
    try {
      if (!user?.id) throw new Error('User not authenticated')

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)

      // Update profile with new avatar URL
      const { data, error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      return publicUrl
    } catch (error) {
      console.error('Upload profile photo failed:', error)
      throw error
    }
  }

  const value = {
    user,
    profile,
    login,
    register,
    logout,
    updateProfile,
    updateProfilePhoto,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
