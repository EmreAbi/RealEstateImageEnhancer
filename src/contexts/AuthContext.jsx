import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (username, password, realEstateOffice) => {
    try {
      // Call API service (currently mock, will be Supabase later)
      const userData = await api.login(username, password, realEstateOffice)

      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.logout()
      setUser(null)
      localStorage.removeItem('user')
    } catch (error) {
      console.error('Logout failed:', error)
      throw error
    }
  }

  const updateProfile = async (updates) => {
    try {
      const updatedUser = await api.updateProfile(user.id, updates)
      const newUser = { ...user, ...updatedUser }
      setUser(newUser)
      localStorage.setItem('user', JSON.stringify(newUser))
      return newUser
    } catch (error) {
      console.error('Update profile failed:', error)
      throw error
    }
  }

  const updateProfilePhoto = async (file) => {
    try {
      const photoUrl = await api.uploadProfilePhoto(user.id, file)
      const updatedUser = { ...user, profilePhoto: photoUrl }
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return photoUrl
    } catch (error) {
      console.error('Upload profile photo failed:', error)
      throw error
    }
  }

  const value = {
    user,
    login,
    logout,
    updateProfile,
    updateProfilePhoto,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
