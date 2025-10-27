import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'approved' | 'pending'
  created_at: string
  approved_at: string | null
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
    fetchUsers()
  }, [])

  const checkAuth = async () => {
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

    if (profile?.role !== 'admin') {
      navigate('/home')
      return
    }

    setUserRole(profile.role)
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string, currentRole: string) => {
    if (currentRole === 'pending') {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        alert('승인 처리 중 오류가 발생했습니다.')
      } else {
        fetchUsers()
      }
    } else if (currentRole === 'approved') {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: 'pending' })
        .eq('id', userId)

      if (error) {
        alert('권한 변경 중 오류가 발생했습니다.')
      } else {
        fetchUsers()
      }
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border border-purple-200',
      approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    }
    const labels = {
      admin: '관리자',
      approved: '승인됨',
      pending: '대기 중',
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[role as keyof typeof colors]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <div className="text-slate-600 text-lg font-medium">로딩 중...</div>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return null
  }

  const pendingUsers = users.filter(u => u.role === 'pending')
  const approvedUsers = users.filter(u => u.role === 'approved')
  const adminUsers = users.filter(u => u.role === 'admin')

  return (
    <div className="min-h-screen bg-slate-400 flex flex-col items-center justify-center py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-black to-purple-600 bg-clip-text text-transparent">
              사용자 관리
            </h1>
            <p className="mt-2 text-slate-600 text-lg">회원가입한 사용자의 접근 권한을 관리합니다</p>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            홈으로 가기
          </button>
        </div>

        {/* 승인 대기 사용자 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 mr-3">
              <span className="text-2xl">⏳</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              승인 대기 <span className="text-amber-600">({pendingUsers.length})</span>
            </h2>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-slate-500 text-lg font-medium">승인 대기 중인 사용자가 없습니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {pendingUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleApprove(user.id, user.role)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            승인
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 승인된 사용자 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 mr-3">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              승인된 사용자 <span className="text-emerald-600">({approvedUsers.length})</span>
            </h2>
          </div>
          {approvedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-slate-500 text-lg font-medium">승인된 사용자가 없습니다</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        이름
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        이메일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        승인일
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {approvedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {user.approved_at ? new Date(user.approved_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleApprove(user.id, user.role)}
                            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            권한 취소
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 관리자 */}
        <div>
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 mr-3">
              <span className="text-2xl">👑</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              관리자 <span className="text-purple-600">({adminUsers.length})</span>
            </h2>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      가입일
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {adminUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(user.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
