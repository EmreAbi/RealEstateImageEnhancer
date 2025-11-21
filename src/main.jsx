import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ImageProvider } from './contexts/ImageContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { SettingsProvider } from './contexts/SettingsContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SettingsProvider>
            <ImageProvider>
              <App />
            </ImageProvider>
          </SettingsProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
