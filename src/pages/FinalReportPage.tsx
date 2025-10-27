import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import JSZip from 'jszip'

interface ReportData {
  basicInfo: any
  equipment: any[]
  visual: any[]
}

export default function FinalReportPage() {
  const navigate = useNavigate()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadReportData()
  }, [])

  const loadReportData = async () => {
    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) {
      alert('보고서 ID를 찾을 수 없습니다.')
      navigate('/basic-info')
      return
    }

    try {
      // 기본 정보
      const { data: basicInfo, error: basicError } = await supabase
        .from('reports_basic_info')
        .select('*')
        .eq('id', reportId)
        .single()

      if (basicError) throw basicError

      // 장비점검 데이터
      const { data: equipment, error: equipmentError } = await supabase
        .from('reports_equipment')
        .select('*')
        .eq('report_id', reportId)

      if (equipmentError) throw equipmentError

      // 육안점검 데이터
      const { data: visual, error: visualError } = await supabase
        .from('reports_visual')
        .select('*')
        .eq('report_id', reportId)

      if (visualError) throw visualError

      setReportData({
        basicInfo,
        equipment: equipment || [],
        visual: visual || []
      })
    } catch (error) {
      console.error('Error loading report data:', error)
      alert('보고서 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = () => {
    // 브라우저 인쇄 기능 사용
    window.print()
  }

  const addWatermarkToImage = async (imageUrl: string, watermarkText: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        
        if (ctx) {
          ctx.drawImage(img, 0, 0)
          
          // 워터마크 설정
          ctx.font = `${Math.floor(img.width / 10)}px Arial`
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          ctx.fillText(watermarkText, img.width / 2, img.height / 2)
        }
        
        resolve(canvas.toDataURL('image/jpeg'))
      }
      
      img.onerror = reject
      img.src = imageUrl
    })
  }

  const downloadAllImages = async () => {
    if (!reportData || reportData.visual.length === 0) return

    try {
      const zip = new JSZip()
      
      for (let i = 0; i < reportData.visual.length; i++) {
        const visual = reportData.visual[i]
        const watermarkedImage = await addWatermarkToImage(visual.image_url, `${i + 1}`)
        
        // Base64에서 데이터 부분만 추출
        const base64Data = watermarkedImage.split(',')[1]
        
        // ZIP에 이미지 추가
        const filename = `점검사진_${i + 1}.jpg`
        zip.file(filename, base64Data, { base64: true })
      }
      
      // ZIP 파일 생성 및 다운로드
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipUrl = URL.createObjectURL(zipBlob)
      
      const link = document.createElement('a')
      link.href = zipUrl
      link.download = `하방점검사진모음_${reportData.basicInfo.apt_name}_${reportData.basicInfo.dong}동${reportData.basicInfo.ho}호.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // 메모리 정리
      URL.revokeObjectURL(zipUrl)
    } catch (error) {
      console.error('이미지 다운로드 오류:', error)
      alert('이미지 다운로드 중 오류가 발생했습니다.')
    }
  }

  const generateCustomerLink = () => {
    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) {
      alert('보고서 ID를 찾을 수 없습니다.')
      return
    }

    const baseUrl = window.location.origin
    const customerLink = `${baseUrl}/customer-report/${reportId}`
    
    // 클립보드에 복사
    navigator.clipboard.writeText(customerLink).then(() => {
      alert(`고객용 링크가 클립보드에 복사되었습니다!\n\n링크: ${customerLink}\n\n이 링크를 고객에게 전달하세요.`)
    }).catch(() => {
      // 클립보드 복사 실패 시 수동으로 표시
      const message = `고객용 링크:\n${customerLink}\n\n이 링크를 복사하여 고객에게 전달하세요.`
      alert(message)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">로딩 중...</div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">보고서 데이터를 찾을 수 없습니다.</div>
      </div>
    )
  }

  return (
        <div className="min-h-screen bg-white px-4">
          <div className="max-w-4xl mx-auto">
            <div ref={reportRef} className="bg-white p-6 md:p-8" style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center border-b-4 border-blue-500 pb-5">
            하방 하자 점검 결과 보고서
          </h1>

          {/* 기본 정보 */}
          <section className="mb-8 mt-10">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-400 pb-2">
             ■ 고객 정보
            </h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 px-4 py-3 text-center">아파트</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">동</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">호수</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">고객명</th>
                  <th className="border border-gray-300 px-4 py-3 text-center">연락처</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-3 text-center">{reportData.basicInfo.apt_name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{reportData.basicInfo.dong}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{reportData.basicInfo.ho}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{reportData.basicInfo.customer_name}</td>
                  <td className="border border-gray-300 px-4 py-3 text-center">{reportData.basicInfo.contact}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 장비점검 */}
          {reportData.equipment.length > 0 && (
            <section className="mb-8 mt-10">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-400 pb-2">
                ■ 장비점검 보고서
              </h2>
              
              {/* 장비점검 데이터를 섹션별로 그룹화 */}
              {(() => {
                const groupedEquipment = reportData.equipment.reduce((acc, item) => {
                  const section = item.item_name.split('_')[0]
                  if (!acc[section]) {
                    acc[section] = []
                  }
                  acc[section].push(item)
                  return acc
                }, {} as Record<string, any[]>)

                return (
                  <div className="space-y-8">
                                         {/* 1. 라돈 점검 */}
                     {groupedEquipment['라돈'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">1. 라돈 점검 (RADON EYE)</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">기준치 초과</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">Pci/L</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['라돈'].map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                    {item.item_name.split('_')[1]}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={item.is_checked}
                                      readOnly
                                      className="w-5 h-5"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!item.is_checked && item.input_text}
                                      readOnly
                                      className="w-5 h-5"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <span className="text-sm">
                                      {item.input_text?.replace(' Pci/L', '') || '-'}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">Pci/L</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 space-y-2">
                          <div>
                            <p><strong>※ Pci/L 기준치:</strong></p>
                            <p>- 1.3Pci/L 일반 가정집 실내환경 기준치</p>
                            <p>- 2.7Pci/L WHO 다중 이용시설 실내 공기질 기준치</p>
                            <p>- 4.0Pci/L 우리나라 다중 이용시설 실내 공기질 기준치(하방 기준치)</p>
                          </div>
                          <div className="mt-2">
                            <p><strong>※ Bq/㎡ 기준치:</strong></p>
                            <p>- 48.00 Bq/m² 일반 가정집 실내환경 기준치</p>
                            <p>- 100.00 Bq/m² WHO 다중 이용시설 실내 공기질 기준치</p>
                            <p>- 148.00 Bq/m² 우리나라 다중 이용시설 실내 공기질 기준치(하방 기준치)</p>
                          </div>
                          <div className="mt-2">
                            <p><strong>※ 라돈이란?</strong></p>
                            <p>- 라돈은 무색무취의 자연방사능 물질로 세계보건기구(WHO)에서 1급 발암물질로 규정하는 흡연 다음으로 폐암을 발생시키는 주요 원인으로 규정 하고 있습니다.</p>
                          </div>
                        </div>
                      </div>
                    )}

                                         {/* 2. 포름알데히드 */}
                     {groupedEquipment['포름알데히드'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">2. 포름알데히드</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">기준치 초과</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">HCHO</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['포름알데히드'].map((item: any, index: number) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                    {item.item_name.split('_')[1]}
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={item.is_checked}
                                      readOnly
                                      className="w-5 h-5"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!item.is_checked && item.input_text}
                                      readOnly
                                      className="w-5 h-5"
                                    />
                                  </td>
                                  <td className="border border-gray-300 px-4 py-3 text-center">
                                    <span className="text-sm">
                                      {item.input_text?.replace(' ppm', '') || '-'}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-2">ppm</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 text-sm text-gray-600 space-y-2">
                          <p><strong>※ HCHO(포름알데히드) 기준치:</strong></p>
                          <p>- 0.01ppm 정상</p>
                          <p>- 0.08ppm 우리나라 다중 이용시설 실내 공기질 기준치(12.01.01) & WHO 기준</p>
                          <p>- 0.16ppm 우리나라 신축 공동 주택 권고 기준치</p>
                          <p>- 0.50ppm 독의 자극이 시작되는 최저치 산업위생학회 형용농도(공장등의 최고치)</p>
                        </div>
                      </div>
                    )}

                                         {/* 3. 열화상카메라 점검 */}
                     {groupedEquipment['열화상카메라'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">3. 열화상카메라 점검</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['열화상카메라'].map((item: any, index: number) => {
                                const details = item.input_text || ''
                                const mold = details.includes('곰팡이:true')
                                const condensation = details.includes('결로:true')
                                const missingInsulation = details.includes('단열재누락:true')
                                const leakage = details.includes('누수:true')
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                      {item.item_name.split('_')[1]}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3">
                                      <div className="flex justify-evenly space-x-1">
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={mold}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          곰팡이
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={condensation}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          결로
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={missingInsulation}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          단열재 누락
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={leakage}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          누수
                                        </label>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                                         {/* 4. 배관 육안 점검 */}
                     {groupedEquipment['배관'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">4. 배관 육안 점검</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['배관'].map((item: any, index: number) => {
                                const details = item.input_text || ''
                                const damage = details.includes('파손:true')
                                const wasteMaterial = details.includes('폐자재:true')
                                const pipeClog = details.includes('배관막힘:true')
                                const other = details.includes('기타:true')
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                      {item.item_name.split('_')[1]}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3">
                                      <div className="flex justify-evenly space-x-1">
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={damage}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          파손
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={wasteMaterial}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          폐자재
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={pipeClog}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          배관막힘
                                        </label>
                                        <label className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={other}
                                            readOnly
                                            className="w-4 h-4 mr-1"
                                          />
                                          기타
                                        </label>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                                         {/* 5. 바닥 레이저 수평 */}
                     {groupedEquipment['바닥수평'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">5. 바닥 레이저 수평</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">좌측 높이</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">우측 높이</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">차이</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['바닥수평'].map((item: any, index: number) => {
                                const details = item.input_text || ''
                                const leftHeight = details.match(/좌측:(\d+)mm/)?.[1] || ''
                                const rightHeight = details.match(/우측:(\d+)mm/)?.[1] || ''
                                const difference = details.match(/차이:(-?\d+)mm/)?.[1] || ''
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                      {item.item_name.split('_')[1]}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={!item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <span className="text-sm">{leftHeight || '-'}</span>
                                      <span className="text-sm text-gray-500 ml-1">mm</span>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <span className="text-sm">{rightHeight || '-'}</span>
                                      <span className="text-sm text-gray-500 ml-1">mm</span>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                                      {difference ? `${difference}mm` : '-'}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          <p><strong>※ 바닥 단차 기준치</strong></p>
                          <p>- 바닥 수평 허용 오차 범위 ± 10mm 이내(하방 기준)</p>
                        </div>
                      </div>
                    )}

                                         {/* 6. 욕실 및 발코니 바닥 타일 배수 역물매 점검 */}
                     {groupedEquipment['배수역물매'] && (
                       <div>
                         <h3 className="text-lg font-bold text-gray-800 mb-2">6. 욕실 및 발코니 바닥 타일 배수 역물매 점검</h3>
                         <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-300" style={{
                  pageBreakInside: 'avoid',
                  breakInside: 'avoid'
                }}>
                            <thead>
                              <tr className="bg-blue-100">
                                <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">세부내용(하자내용)</th>
                                <th className="border border-gray-300 px-4 py-3 text-center">비고</th>
                              </tr>
                            </thead>
                            <tbody>
                              {groupedEquipment['배수역물매'].map((item: any, index: number) => {
                                const details = item.input_text || ''
                                const defectDetails = details.match(/하자내용:([^,]+)/)?.[1] || ''
                                const remarks = details.match(/비고:([^,]+)/)?.[1] || ''
                                
                                return (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-3 font-medium text-center">
                                      {item.item_name.split('_')[1]}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={!item.is_checked}
                                        readOnly
                                        className="w-5 h-5"
                                      />
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3">
                                      <span className="text-sm">{defectDetails || '-'}</span>
                                    </td>
                                    <td className="border border-gray-300 px-4 py-3">
                                      <span className="text-sm">{remarks || '-'}</span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </section>
          )}

          {/* 육안점검 */}
          {reportData.visual.length > 0 && (
            <section className="mb-8 pt-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-400 pb-2">
              ■ 육안점검 보고서
              </h2>
              <div className="space-y-6">
                {(() => {
                  // 이미지를 location + classification + details로 그룹화하여 각 하자를 구분
                  const groupedVisuals = reportData.visual.reduce((acc, item) => {
                    // 고유 키 생성 (위치 + 분류 + 내용 조합)
                    const uniqueKey = `${item.location}_${item.classification}_${item.details}`
                    
                    if (!acc[uniqueKey]) {
                      acc[uniqueKey] = {
                        fullImage: null,
                        closeupImage: null,
                        angleImage: null,
                        location: item.location,
                        classification: item.classification,
                        details: item.details
                      }
                    }
                    
                    if (item.image_type === 'full') {
                      acc[uniqueKey].fullImage = item
                    } else if (item.image_type === 'closeup') {
                      acc[uniqueKey].closeupImage = item
                    } else if (item.image_type === 'angle') {
                      acc[uniqueKey].angleImage = item
                    }
                    
                    return acc
                  }, {} as Record<string, any>)

                  return Object.values(groupedVisuals).map((group: any, index) => (
                    <div key={index} className="mb-8 border-2 border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold mb-2 text-lg p-2 bg-blue-50">세대 하자 {index + 1}</h3>
                      
                      {/* 사진 섹션 */}
                      <div className="mb-2 px-4 print:m-2">
                        <div className="flex gap-4">
                          {/* 전체 사진 */}
                          {group.fullImage && (
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-600 mb-1">전체 사진</p>
                              <img
                                src={group.fullImage.image_url}
                                alt="전체 사진"
                                className="w-full h-40 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                          
                          {/* 확대 사진 */}
                          {group.closeupImage && (
                            <div className="flex-1">
                              <p className="text-sm font-bold text-gray-600 mb-1">확대 사진</p>
                              <img
                                src={group.closeupImage.image_url}
                                alt="확대 사진"
                                className="w-full h-40 object-cover rounded-lg border"
                              />
                            </div>
                          )}
                        </div>
                        
                        {/* 다른각도 사진 (있는 경우) */}
                        {group.angleImage && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">다른각도 사진</p>
                            <img
                              src={group.angleImage.image_url}
                              alt="다른각도 사진"
                              className="w-full h-40 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* 하자 정보 */}
                      <div className="mt-2 px-4 print:m-2">
                        <table className="w-full border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-100">
                              <th className="border border-gray-300 px-4 py-3 text-center">위치</th>
                              <th className="border border-gray-300 px-4 py-3 text-center">분류</th>
                              <th className="border border-gray-300 px-4 py-3 text-center">내용</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-gray-300 px-4 py-3 text-center">{group.location || '-'}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center">{group.classification || '-'}</td>
                              <td className="border border-gray-300 px-4 py-3 text-center">{group.details || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </section>
          )}

          {/* 액션 버튼 */}
          <div className="action-buttons flex flex-col md:flex-row gap-4 border-t-2 border-blue-600 pt-8">
            <button
              onClick={generatePDF}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              📄 PDF 다운로드
            </button>
            {reportData.visual.length > 0 && (
              <button
                onClick={downloadAllImages}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                📷 사진 ZIP 다운로드<br/> (워터마크)
              </button>
            )}
            <button
              onClick={generateCustomerLink}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              🔗 고객용 링크 생성
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}



