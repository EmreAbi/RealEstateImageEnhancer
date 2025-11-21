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
    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          // Load user profile
          const userProfile = await getUserProfile(session.user.id)
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          try {
            const userProfile = await getUserProfile(session.user.id)
            setProfile(userProfile)
          } catch (error) {
            console.error('Error loading profile:', error)
          }
        } else {
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
      const { user: authUser } = await signUp(email, password, {
        username,
        real_estate_office: realEstateOffice
      })

      if (authUser) {
        // Create profile
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authUser.id,
            username,
            real_estate_office: realEstateOffice,
            email
          }])
          .select()
          .single()

        if (profileError) throw profileError

        setUser(authUser)
        setProfile(newProfile)
        return { user: authUser, profile: newProfile }
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

  const value = {
    user,
    profile,
    login,
    register,
    logout,
    updateProfile,
    loading,
    // Legacy support - mevcut Login component uyumluluğu için
    user: profile || user
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
