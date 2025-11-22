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
