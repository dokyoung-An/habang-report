import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'pending') {
        await supabase.auth.signOut()
        navigate('/login')
      } else {
        setUserRole(profile?.role || null)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-400 flex flex-col items-center justify-center py-8">
      {/* 상단 헤더 */}
      <div className="max-w-7xl w-full mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          하방 점검 보고서
        </h1>
        <div className="flex gap-4 items-center">
          {userRole === 'admin' && (
            <button
              onClick={() => navigate('/admin-users')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              사용자 관리
            </button>
          )}
          <button
            onClick={handleLogout}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 중앙 컨텐츠 */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <p className="text-gray-600 mb-8">
              아파트/시설물 점검 보고서 자동 생성
            </p>
            
            <button
              onClick={() => navigate('/basic-info')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              보고서 작성하기
            </button>

            <button
              onClick={() => navigate('/manage-reports')}
              className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              보고서 관리
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



