/**
 * Client-side watermark utility
 * Adds watermark to images in the browser using Canvas API
 */

/**
 * Add watermark to an image
 * @param {string} imageUrl - URL of the source image
 * @param {string} logoUrl - URL of the logo (base64 or URL)
 * @param {object} options - Watermark options
 * @returns {Promise<Blob>} - Watermarked image as blob
 */
export async function addWatermarkToImage(imageUrl, logoUrl, options = {}) {
  const {
    position = 'bottom-right',
    opacity = 0.3,
    logoScale = 0.1 // Logo size as % of image width
  } = options

  return new Promise((resolve, reject) => {
    // Load source image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // Load logo
      const logo = new Image()
      logo.crossOrigin = 'anonymous'

      logo.onload = () => {
        try {
          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')

          // Draw source image
          ctx.drawImage(img, 0, 0)

          // Calculate logo dimensions
          const logoWidth = Math.floor(img.width * logoScale)
          const logoHeight = Math.floor((logo.height / logo.width) * logoWidth)

          // Calculate position
          const padding = 20
          let x = 0
          let y = 0

          switch (position) {
            case 'bottom-right':
              x = img.width - logoWidth - padding
              y = img.height - logoHeight - padding
              break
            case 'bottom-left':
              x = padding
              y = img.height - logoHeight - padding
              break
            case 'top-right':
              x = img.width - logoWidth - padding
              y = padding
              break
            case 'top-left':
              x = padding
              y = padding
              break
            case 'center':
              x = (img.width - logoWidth) / 2
              y = (img.height - logoHeight) / 2
              break
          }

          // Draw logo with opacity
          ctx.globalAlpha = opacity
          ctx.drawImage(logo, x, y, logoWidth, logoHeight)
          ctx.globalAlpha = 1.0

          // Convert to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          }, 'image/png', 0.95)
        } catch (error) {
          reject(error)
        }
      }

      logo.onerror = () => reject(new Error('Failed to load logo'))
      logo.src = logoUrl
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}

/**
 * Generate watermark preview
 * @param {string} imageUrl - URL of the source image
 * @param {string} logoUrl - URL of the logo
 * @param {object} options - Watermark options
 * @returns {Promise<string>} - Preview image as data URL
 */
export async function generateWatermarkPreview(imageUrl, logoUrl, options = {}) {
  const {
    position = 'bottom-right',
    opacity = 0.3,
    logoScale = 0.1,
    maxWidth = 400,
    maxHeight = 300
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const logo = new Image()
      logo.crossOrigin = 'anonymous'

      logo.onload = () => {
        try {
          // Calculate preview dimensions (maintain aspect ratio)
          let width = img.width
          let height = img.height

          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }

          // Create canvas
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')

          // Draw source image (scaled)
          ctx.drawImage(img, 0, 0, width, height)

          // Calculate logo dimensions (scaled)
          const logoWidth = Math.floor(width * logoScale)
          const logoHeight = Math.floor((logo.height / logo.width) * logoWidth)

          // Calculate position
          const padding = Math.floor(20 * (width / img.width)) // Scale padding too
          let x = 0
          let y = 0

          switch (position) {
            case 'bottom-right':
              x = width - logoWidth - padding
              y = height - logoHeight - padding
              break
            case 'bottom-left':
              x = padding
              y = height - logoHeight - padding
              break
            case 'top-right':
              x = width - logoWidth - padding
              y = padding
              break
            case 'top-left':
              x = padding
              y = padding
              break
            case 'center':
              x = (width - logoWidth) / 2
              y = (height - logoHeight) / 2
              break
          }

          // Draw logo with opacity
          ctx.globalAlpha = opacity
          ctx.drawImage(logo, x, y, logoWidth, logoHeight)
          ctx.globalAlpha = 1.0

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.8)
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }

      logo.onerror = () => reject(new Error('Failed to load logo'))
      logo.src = logoUrl
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageUrl
  })
}
