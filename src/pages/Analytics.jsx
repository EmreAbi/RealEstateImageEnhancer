import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useImages } from '../contexts/ImageContext'
import { supabase } from '../lib/supabase'
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  Image as ImageIcon,
  ArrowLeft,
  Activity
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Analytics() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { images, aiModels } = useImages()
  const [enhancementLogs, setEnhancementLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      loadEnhancementLogs()
    }
  }, [user])

  const loadEnhancementLogs = async () => {
    try {
      setLoading(true)
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setEnhancementLogs(data || [])
    } catch (error) {
      console.error('Error loading enhancement logs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate statistics
  const stats = {
    totalEnhancements: enhancementLogs.length,
    successfulEnhancements: enhancementLogs.filter(log => log.status === 'completed').length,
    failedEnhancements: enhancementLogs.filter(log => log.status === 'failed').length,
    averageDuration: enhancementLogs
      .filter(log => log.duration_ms)
      .reduce((acc, log) => acc + log.duration_ms, 0) /
      (enhancementLogs.filter(log => log.duration_ms).length || 1),
    totalCost: enhancementLogs.reduce((acc, log) => acc + (parseFloat(log.cost_credits) || 0), 0)
  }

  // Model usage distribution
  const modelUsage = {}
  enhancementLogs.forEach(log => {
    const modelName = log.ai_models?.display_name || 'Unknown'
    modelUsage[modelName] = (modelUsage[modelName] || 0) + 1
  })

  // Daily enhancement count (last 7 days)
  const dailyEnhancements = {}
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  last7Days.forEach(date => {
    dailyEnhancements[date] = 0
  })

  enhancementLogs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0]
    if (dailyEnhancements.hasOwnProperty(date)) {
      dailyEnhancements[date]++
    }
  })

  const maxDaily = Math.max(...Object.values(dailyEnhancements), 1)

  // Recent activity
  const recentActivity = enhancementLogs.slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-8 h-8 text-primary-600" />
            <h1 className="text-3xl font-bold text-gray-900">Kullanım İstatistikleri</h1>
          </div>
          <p className="text-gray-600">
            Görsel iyileştirme ve kullanım detaylarınız
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Toplam İşlem</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEnhancements}</p>
                <p className="text-sm text-green-600 mt-1">
                  {stats.successfulEnhancements} başarılı
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Başarı Oranı</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalEnhancements > 0
                    ? ((stats.successfulEnhancements / stats.totalEnhancements) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.failedEnhancements} başarısız
                </p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Ort. Süre</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.averageDuration / 1000).toFixed(1)}s
                </p>
                <p className="text-sm text-gray-500 mt-1">işlem başına</p>
              </div>

              <div className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-gray-700">Toplam Kredi</h3>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalCost.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">harcanan</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Activity Chart */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-600" />
                  Son 7 Gün Aktivitesi
                </h3>
                <div className="space-y-4">
                  {last7Days.map(date => (
                    <div key={date}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {new Date(date).toLocaleDateString('tr-TR', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {dailyEnhancements[date]}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(dailyEnhancements[date] / maxDaily) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Model Usage Distribution */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                  Model Kullanım Dağılımı
                </h3>
                <div className="space-y-4">
                  {Object.entries(modelUsage).map(([model, count]) => {
                    const percentage = ((count / stats.totalEnhancements) * 100).toFixed(1)
                    return (
                      <div key={model}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 font-medium">{model}</span>
                          <span className="text-gray-600">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {Object.keys(modelUsage).length === 0 && (
                    <p className="text-center text-gray-500 py-4">Henüz veri yok</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Son İşlemler
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Görsel
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Model
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Durum
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Süre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                        Tarih
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentActivity.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {log.images?.name || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.ai_models?.display_name || 'Unknown'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {log.status === 'completed' ? 'Başarılı' :
                             log.status === 'failed' ? 'Başarısız' : 'İşleniyor'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentActivity.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Henüz işlem yapılmamış</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
