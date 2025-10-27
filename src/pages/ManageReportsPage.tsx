import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Report {
  id: string
  apt_name: string
  dong: string
  ho: string
  contact: string
  created_at: string
  user_id: string | null
  user_profiles?: {
    name: string
  } | null
}

interface BoardReport {
  id: string
  report_id: string
  title: string
  content: string
  status: string
  view_count: number
  created_at: string
  reports_basic_info: {
    apt_name: string
    dong: string
    ho: string
    customer_name: string
  }
}

export default function ManageReportsPage() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'reports' | 'board'>('reports')
  const [boardReports, setBoardReports] = useState<BoardReport[]>([])
  const [boardLoading, setBoardLoading] = useState(false)
  const [showBoardModal, setShowBoardModal] = useState(false)
  const [selectedReportForBoard, setSelectedReportForBoard] = useState<string | null>(null)
  const [boardTitle, setBoardTitle] = useState('')
  const [boardContent, setBoardContent] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    checkUserRole()
  }, [])

  useEffect(() => {
    if (currentUserId && userRole !== null) {
      loadReports()
    }
  }, [currentUserId, userRole])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredReports(reports)
    } else {
      const filtered = reports.filter(report => 
        report.contact.slice(-4).includes(searchTerm.trim())
      )
      setFilteredReports(filtered)
    }
    setCurrentPage(1)
  }, [reports, searchTerm])

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        setUserRole(profile.role)
      }
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  useEffect(() => {
    if (activeTab === 'board') {
      loadBoardReports()
    }
  }, [activeTab])

  const loadReports = async () => {
    if (!currentUserId || userRole === null) return

    try {
      let query = supabase
        .from('reports_basic_info')
        .select('*')
        .order('created_at', { ascending: false })

      // 관리자가 아닌 경우 자신의 보고서만 조회
      if (userRole !== 'admin') {
        query = query.eq('user_id', currentUserId)
      }
      // 관리자는 모든 보고서 조회

      const { data: reportsData, error } = await query

      if (error) throw error

      // user_profiles에서 작성자 정보 가져오기
      if (reportsData && reportsData.length > 0) {
        const userIds = [...new Set(reportsData.map(r => r.user_id).filter(Boolean))]
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', userIds)

          // 보고서에 작성자 정보 추가
          const reportsWithProfiles = reportsData.map(report => ({
            ...report,
            user_profiles: profilesData?.find(p => p.id === report.user_id) || null
          }))

          console.log('Loaded reports:', reportsWithProfiles.length, 'Admin:', userRole === 'admin')
          setReports(reportsWithProfiles)
          setFilteredReports(reportsWithProfiles)
        } else {
          setReports(reportsData)
          setFilteredReports(reportsData)
        }
      } else {
        setReports([])
        setFilteredReports([])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      alert('보고서 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!confirm('정말 이 보고서를 삭제하시겠습니까?')) return

    try {
      // 관련 장비점검 데이터 삭제
      await supabase
        .from('reports_equipment')
        .delete()
        .eq('report_id', reportId)

      // 관련 육안점검 데이터 및 이미지 삭제
      const { data: visualData } = await supabase
        .from('reports_visual')
        .select('image_path')
        .eq('report_id', reportId)

      if (visualData) {
        for (const item of visualData) {
          await supabase.storage
            .from('inspection-images')
            .remove([item.image_path])
        }
      }

      await supabase
        .from('reports_visual')
        .delete()
        .eq('report_id', reportId)

      // 기본 정보 삭제
      const { error } = await supabase
        .from('reports_basic_info')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      alert('보고서가 삭제되었습니다.')
      loadReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('보고서 삭제에 실패했습니다.')
    }
  }

  const handleView = (reportId: string) => {
    localStorage.setItem('current_report_id', reportId)
    navigate('/final-report')
  }

  const handleEdit = (reportId: string) => {
    setSelectedReportId(reportId)
    setShowEditModal(true)
  }

  const handleEditType = (type: 'equipment' | 'visual') => {
    if (selectedReportId) {
      localStorage.setItem('current_report_id', selectedReportId)
      if (type === 'equipment') {
        navigate('/equipment-check')
      } else {
        navigate('/visual-check')
      }
    }
    setShowEditModal(false)
    setSelectedReportId(null)
  }

  const closeModal = () => {
    setShowEditModal(false)
    setSelectedReportId(null)
  }

  // 게시판 관련 함수들
  const loadBoardReports = async () => {
    setBoardLoading(true)
    try {
      const { data, error } = await supabase
        .from('customer_reports')
        .select(`
          *,
          reports_basic_info (
            apt_name,
            dong,
            ho,
            customer_name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBoardReports(data || [])
    } catch (error) {
      console.error('게시판 데이터 로드 오류:', error)
      alert('게시판 데이터를 불러오는데 실패했습니다.')
    } finally {
      setBoardLoading(false)
    }
  }



  const handleSubmitToBoard = async () => {
    if (!selectedReportForBoard || !boardTitle.trim()) {
      alert('제목을 입력해주세요.')
      return
    }

    try {
      const { error } = await supabase
        .from('customer_reports')
        .insert({
          report_id: selectedReportForBoard,
          title: boardTitle,
          content: boardContent,
          status: 'active'
        })

      if (error) throw error

      alert('게시판에 등록되었습니다.')
      setShowBoardModal(false)
      setBoardTitle('')
      setBoardContent('')
      setSelectedReportForBoard(null)
      loadBoardReports()
    } catch (error) {
      console.error('게시판 등록 오류:', error)
      alert('게시판 등록에 실패했습니다.')
    }
  }

  const handleToggleBoardStatus = async (reportId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    try {
      const { error } = await supabase
        .from('customer_reports')
        .update({ status: newStatus })
        .eq('id', reportId)

      if (error) throw error

      alert(`게시판 상태가 ${newStatus === 'active' ? '활성화' : '비활성화'}되었습니다.`)
      loadBoardReports()
    } catch (error) {
      console.error('게시판 상태 변경 오류:', error)
      alert('게시판 상태 변경에 실패했습니다.')
    }
  }

  const handleDeleteFromBoard = async (reportId: string) => {
    if (!confirm('게시판에서 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('customer_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error

      alert('게시판에서 삭제되었습니다.')
      loadBoardReports()
    } catch (error) {
      console.error('게시판 삭제 오류:', error)
      alert('게시판 삭제에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-300 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              보고서 관리
            </h1>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              홈으로
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-3 rounded-md font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                📋 보고서 목록
              </button>
              
            </div>
          </div>

          {/* 보고서 목록 탭 */}
          {activeTab === 'reports' && (
            <>
              {/* 검색 기능 */}
              <div className="mb-6">
                <div className="max-w-md">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    연락처 뒤 4자리로 검색
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="예: 5678"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      maxLength={4}
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                  {searchTerm && (
                    <p className="text-sm text-gray-600 mt-1">
                      "{searchTerm}"로 검색된 결과: {filteredReports.length}개
                    </p>
                  )}
                </div>
              </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm ? (
                <div>
                  <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-2">다른 검색어를 시도해보세요.</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    검색 초기화
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 text-lg">저장된 보고서가 없습니다.</p>
                  <button
                    onClick={() => navigate('/basic-info')}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                  >
                    새 보고서 작성
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-center">아파트</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">동</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">호수</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">연락처</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">작성자</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">작성일</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">{report.apt_name}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{report.dong}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{report.ho}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">{report.contact}</td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {report.user_profiles?.name || '-'}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          {new Date(report.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => handleView(report.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                            >
                              보기
                            </button>
                            <button
                              onClick={() => handleEdit(report.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                            >
                              수정
                            </button>
                            {userRole === 'admin' && (
                              <>
                                <button
                                  onClick={() => handleDelete(report.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {filteredReports.length > itemsPerPage && (
                <div className="flex justify-center mt-6 gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    이전
                  </button>
                  {Array.from({ length: Math.ceil(filteredReports.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded transition-colors ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredReports.length / itemsPerPage), prev + 1))}
                    disabled={currentPage === Math.ceil(filteredReports.length / itemsPerPage)}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          )}
            </>
          )}

          {/* 게시판 관리 탭 */}
          {activeTab === 'board' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  공개 보고서 게시판 관리
                </h2>
                <div className="text-sm text-gray-600">
                  총 {boardReports.length}개 게시물
                </div>
              </div>

              {boardLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">게시판을 불러오는 중...</p>
                </div>
              ) : boardReports.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">게시판에 등록된 보고서가 없습니다.</p>
                  <p className="text-gray-400 text-sm mt-2">보고서 목록에서 게시판에 추가할 수 있습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100 ">
                        <th className="border border-gray-300 px-4 py-3 text-center">제목</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">아파트</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">고객명</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">상태</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">조회수</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">등록일</th>
                        <th className="border border-gray-300 px-4 py-3 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boardReports.map((report) => (
                        <tr key={report.id} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="max-w-xs truncate" title={report.title}>
                              {report.title}
                            </div>
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {report.reports_basic_info.apt_name} {report.reports_basic_info.dong}동 {report.reports_basic_info.ho}호
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {report.reports_basic_info.customer_name}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              report.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {report.status === 'active' ? '활성' : '비활성'}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {report.view_count}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {new Date(report.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => handleToggleBoardStatus(report.id, report.status)}
                                className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                  report.status === 'active'
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                {report.status === 'active' ? '비활성화' : '활성화'}
                              </button>
                              <button
                                onClick={() => handleDeleteFromBoard(report.id)}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 수정 팝업 모달 */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              수정할 보고서 선택
            </h3>
            <p className="text-gray-600 mb-6">
              어떤 보고서를 수정하시겠습니까?
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleEditType('equipment')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                🔧 장비점검 보고서 수정
              </button>
              
              <button
                onClick={() => handleEditType('visual')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                📷 육안점검 보고서 수정
              </button>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 게시판 등록 모달 */}
      {showBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              게시판에 보고서 등록
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="boardTitle" className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="boardTitle"
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  placeholder="게시판 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="boardContent" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <textarea
                  id="boardContent"
                  value={boardContent}
                  onChange={(e) => setBoardContent(e.target.value)}
                  placeholder="게시판 내용을 입력하세요 (선택사항)"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmitToBoard}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                등록
              </button>
              <button
                onClick={() => {
                  setShowBoardModal(false)
                  setBoardTitle('')
                  setBoardContent('')
                  setSelectedReportForBoard(null)
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



