import { useImages } from '../contexts/ImageContext'
import { Folder, Image, Sparkles, HardDrive, TrendingUp } from 'lucide-react'

export default function DashboardStats() {
  const { folders, images } = useImages()

  // Calculate statistics
  const stats = {
    totalImages: images.length,
    enhancedImages: images.filter(img => img.status === 'enhanced').length,
    processingImages: images.filter(img => img.status === 'processing').length,
    totalFolders: folders.length,
    totalStorage: images.reduce((acc, img) => acc + (img.file_size || 0), 0),
    enhancedStorage: images
      .filter(img => img.status === 'enhanced')
      .reduce((acc, img) => acc + (img.file_size || 0), 0)
  }

  const enhancementRate = stats.totalImages > 0
    ? ((stats.enhancedImages / stats.totalImages) * 100).toFixed(1)
    : 0

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const statCards = [
    {
      title: 'Toplam Görsel',
      value: stats.totalImages,
      icon: Image,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'İyileştirilmiş',
      value: stats.enhancedImages,
      icon: Sparkles,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: `${enhancementRate}% oran`
    },
    {
      title: 'Klasör Sayısı',
      value: stats.totalFolders,
      icon: Folder,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      title: 'Toplam Depolama',
      value: formatBytes(stats.totalStorage),
      icon: HardDrive,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      valueClass: 'text-2xl'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
            </div>
            {stats.processingImages > 0 && stat.title === 'İyileştirilmiş' && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                {stats.processingImages} işleniyor
              </span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">{stat.title}</p>
            <p className={`font-bold text-gray-900 ${stat.valueClass || 'text-3xl'}`}>
              {stat.value}
            </p>
            {stat.subtitle && (
              <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
