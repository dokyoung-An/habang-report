import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function BasicInfoPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    apt_name: '',
    dong: '',
    ho: '',
    customer_name: '',
    contact: ''
  })
  const [loading, setLoading] = useState(false)

  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const phoneNumber = value.replace(/[^\d]/g, '')
    
    // 전화번호 형식에 맞게 '-' 삽입
    if (phoneNumber.length <= 3) {
      return phoneNumber
    } else if (phoneNumber.length <= 7) {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`
    } else {
      return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = name === 'contact' ? formatPhoneNumber(value) : value
    
    setFormData({
      ...formData,
      [name]: formattedValue
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 현재 로그인한 사용자 ID 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('reports_basic_info')
        .insert([{
          ...formData,
          user_id: user?.id || null
        }])
        .select()
        .single()

      if (error) throw error

      // 생성된 보고서 ID를 로컬 스토리지에 저장
      localStorage.setItem('current_report_id', data.id)
      
      navigate('/select-report-type')
    } catch (error) {
      console.error('Error saving basic info:', error)
      alert('기본 정보 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-400 py-8 px-8 flex items-center justify-center">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-6 md:p-8 shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
            기본 정보 입력
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apt_name" className="block text-sm font-medium text-gray-700 mb-2">
                아파트 이름
              </label>
              <input
                type="text"
                id="apt_name"
                name="apt_name"
                required
                value={formData.apt_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="예: 하방 아파트"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="dong" className="block text-sm font-medium text-gray-700 mb-2">
                  동
                </label>
                <input
                  type="text"
                  id="dong"
                  name="dong"
                  required
                  value={formData.dong}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="101"
                />
              </div>

              <div>
                <label htmlFor="ho" className="block text-sm font-medium text-gray-700 mb-2">
                  호수
                </label>
                <input
                  type="text"
                  id="ho"
                  name="ho"
                  required
                  value={formData.ho}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="1001"
                />
              </div>
            </div>
      

            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                고객명
              </label>
              <input
                type="text"
                id="customer_name"
                name="customer_name"
                required
                value={formData.customer_name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="김하방"
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                연락처
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                value={formData.contact}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="010-1234-5678"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? '저장 중...' : '보고서 작성 시작'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}



