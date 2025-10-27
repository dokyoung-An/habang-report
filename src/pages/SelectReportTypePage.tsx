import { useNavigate } from 'react-router-dom'

export default function SelectReportTypePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            보고서 유형 선택
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/equipment-check')}
              className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-8 transition-all duration-200 hover:shadow-lg"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🔧</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  장비점검 보고서
                </h2>
                <p className="text-gray-600">
                  장비 상태 체크리스트 작성
                </p>
              </div>
            </button>

            <button
              onClick={() => navigate('/visual-check')}
              className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-8 transition-all duration-200 hover:shadow-lg"
            >
              <div className="text-center">
                <div className="text-5xl mb-4">📷</div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  육안점검 보고서
                </h2>
                <p className="text-gray-600">
                  사진 기반 하자 보고서 작성
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/final-report')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              최종 보고서 확인하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



