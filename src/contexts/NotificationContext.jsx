import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('notifications')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever notifications change
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
  }, [notifications])

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(), // Unique ID
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    }

    setNotifications((prev) => [newNotification, ...prev])
    return newNotification.id
  }, [])

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    )
  }, [])

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }, [])

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length

  // Success notification helper
  const notifySuccess = useCallback((title, message, meta = {}) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...meta,
    })
  }, [addNotification])

  // Info notification helper
  const notifyInfo = useCallback((title, message, meta = {}) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...meta,
    })
  }, [addNotification])

  // Warning notification helper
  const notifyWarning = useCallback((title, message, meta = {}) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...meta,
    })
  }, [addNotification])

  // Error notification helper
  const notifyError = useCallback((title, message, meta = {}) => {
    return addNotification({
      type: 'error',
      title,
      message,
      ...meta,
    })
  }, [addNotification])

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyInfo,
    notifyWarning,
    notifyError,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
