import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Pica from 'pica'

interface RadonItem {
  location: string
  normal: boolean
  exceeds_standard: boolean
  value: string
  image: File | string | null
}

interface FormaldehydeItem {
  location: string
  normal: boolean
  exceeds_standard: boolean
  value: string
}

interface ThermalCameraItem {
  location: string
  normal: boolean
  defect: boolean
  image1: File | string | null
  image2: File | string | null
}

interface PipingItem {
  location: string
  normal: boolean
  damage: boolean
  waste_material: boolean
  pipe_clog: boolean
  other: boolean
}

interface FloorLevelingItem {
  location: string
  normal: boolean
  defect: boolean
  left_height: string
  right_height: string
  difference: string
}

interface DrainageItem {
  location: string
  normal: boolean
  defect: boolean
  defect_details: string
  remarks: string
}

export default function EquipmentCheckPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const pica = new Pica()
  
  // 라돈 점검 데이터
  const [radonItems, setRadonItems] = useState<RadonItem[]>([
    { location: '주방/거실', normal: true, exceeds_standard: false, value: '', image: null },
    { location: '욕실1', normal: true, exceeds_standard: false, value: '', image: null },
    { location: '침실1', normal: true, exceeds_standard: false, value: '', image: null }
  ])

  // 포름알데히드 데이터
  const [formaldehydeItems, setFormaldehydeItems] = useState<FormaldehydeItem[]>([
    { location: '주방/거실', normal: true, exceeds_standard: false, value: '' },
    { location: '욕실1', normal: true, exceeds_standard: false, value: '' },
    { location: '침실1', normal: true, exceeds_standard: false, value: '' }
  ])

  // 열화상카메라 점검 데이터
  const [thermalItems, setThermalItems] = useState<ThermalCameraItem[]>([
  
    { location: '거실', normal: true, defect: false, image1: null, image2: null },
    { location: '침실1', normal: true, defect: false, image1: null, image2: null },
    { location: '침실2', normal: true, defect: false, image1: null, image2: null },
    { location: '침실3', normal: true, defect: false, image1: null, image2: null },
  
  ])

  // 배관 육안 점검 데이터
  const [pipingItems, setPipingItems] = useState<PipingItem[]>([
    { location: '욕실1', normal: true, damage: false, waste_material: false, pipe_clog: false, other: false },
    { location: '욕실2', normal: true, damage: false, waste_material: false, pipe_clog: false, other: false },
    { location: '발코니', normal: true, damage: false, waste_material: false, pipe_clog: false, other: false },
    { location: '다용도실', normal: true, damage: false, waste_material: false, pipe_clog: false, other: false }
  ])

  // 바닥 레이저 수평 데이터
  const [floorLevelingItems, setFloorLevelingItems] = useState<FloorLevelingItem[]>([
    { location: '주방', normal: true, defect: false, left_height: '', right_height: '', difference: '' },
    { location: '거실', normal: true, defect: false, left_height: '', right_height: '', difference: '' },
    { location: '침실1', normal: true, defect: false, left_height: '', right_height: '', difference: '' },
    { location: '침실2', normal: false, defect: true, left_height: '', right_height: '', difference: '' },
    { location: '알파룸', normal: true, defect: false, left_height: '', right_height: '', difference: '' }
  ])

  // 욕실 및 발코니 바닥 타일 배수 역물매 점검 데이터
  const [drainageItems, setDrainageItems] = useState<DrainageItem[]>([
    { location: '욕실1', normal: true, defect: false, defect_details: '', remarks: '' },
    { location: '욕실2', normal: true, defect: false, defect_details: '', remarks: '' },
    { location: '발코니', normal: false, defect: true, defect_details: '', remarks: '' },
    { location: '다용도실', normal: true, defect: false, defect_details: '', remarks: '' }
  ])

  // 라돈 점검 핸들러
  const handleRadonChange = (index: number, field: 'location' | 'normal' | 'exceeds_standard' | 'value' | 'image', value: boolean | string | File | null) => {
    const newItems = [...radonItems]
    if (field === 'normal' && value === true) {
      newItems[index].exceeds_standard = false
    } else if (field === 'exceeds_standard' && value === true) {
      newItems[index].normal = false
    }
    (newItems[index] as any)[field] = value
    setRadonItems(newItems)
  }

  // 포름알데히드 핸들러
  const handleFormaldehydeChange = (index: number, field: 'location' | 'normal' | 'exceeds_standard' | 'value', value: boolean | string) => {
    const newItems = [...formaldehydeItems]
    if (field === 'normal' && value === true) {
      newItems[index].exceeds_standard = false
    } else if (field === 'exceeds_standard' && value === true) {
      newItems[index].normal = false
    }
    (newItems[index] as any)[field] = value
    setFormaldehydeItems(newItems)
  }

  // 열화상카메라 핸들러
  const handleThermalChange = (index: number, field: 'location' | 'normal' | 'defect' | 'image1' | 'image2', value: boolean | string | File | null) => {
    const newItems: ThermalCameraItem[] = [...thermalItems]
    if (field === 'normal' && value === true) {
      newItems[index] = { ...newItems[index], normal: true, defect: false }
    } else if (field === 'defect' && value === true) {
      newItems[index] = { ...newItems[index], normal: false, defect: true }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setThermalItems(newItems)
  }

  // 배관 육안 점검 핸들러
  const handlePipingChange = (index: number, field: string, value: boolean | string) => {
    const newItems = [...pipingItems]
    if (field === 'normal' && value === true) {
      newItems[index].damage = false
      newItems[index].waste_material = false
      newItems[index].pipe_clog = false
      newItems[index].other = false
    } else if (field !== 'normal' && field !== 'location' && value === true) {
      newItems[index].normal = false
    }
    (newItems[index] as any)[field] = value
    setPipingItems(newItems)
  }

  // 바닥 레이저 수평 핸들러
  const handleFloorLevelingChange = (index: number, field: string, value: boolean | string) => {
    const newItems = [...floorLevelingItems]
    if (field === 'normal' && value === true) {
      newItems[index].defect = false
    } else if (field === 'defect' && value === true) {
      newItems[index].normal = false
    }
    (newItems[index] as any)[field] = value
    
    // 차이 계산
    if (field === 'left_height' || field === 'right_height') {
      const left = parseFloat(newItems[index].left_height) || 0
      const right = parseFloat(newItems[index].right_height) || 0
      newItems[index].difference = (left - right).toString()
    }
    
    setFloorLevelingItems(newItems)
  }

  // 배수 역물매 점검 핸들러
  const handleDrainageChange = (index: number, field: string, value: boolean | string) => {
    const newItems = [...drainageItems]
    if (field === 'normal' && value === true) {
      newItems[index].defect = false
    } else if (field === 'defect' && value === true) {
      newItems[index].normal = false
    }
    (newItems[index] as any)[field] = value
    setDrainageItems(newItems)
  }

  // 행 추가/삭제 함수들
  const addRadonItem = () => {
    setRadonItems([...radonItems, { location: '', normal: true, exceeds_standard: false, value: '', image: null }])
  }

  const removeRadonItem = (index: number) => {
    if (radonItems.length > 1) {
      setRadonItems(radonItems.filter((_, i) => i !== index))
    }
  }

  const addFormaldehydeItem = () => {
    setFormaldehydeItems([...formaldehydeItems, { location: '', normal: true, exceeds_standard: false, value: '' }])
  }

  const removeFormaldehydeItem = (index: number) => {
    if (formaldehydeItems.length > 1) {
      setFormaldehydeItems(formaldehydeItems.filter((_, i) => i !== index))
    }
  }

  const addThermalItem = () => {
    setThermalItems([...thermalItems, { location: '', normal: true, defect: false, image1: null, image2: null }])
  }

  const removeThermalItem = (index: number) => {
    if (thermalItems.length > 1) {
      setThermalItems(thermalItems.filter((_, i) => i !== index))
    }
  }

  const addPipingItem = () => {
    setPipingItems([...pipingItems, { location: '', normal: true, damage: false, waste_material: false, pipe_clog: false, other: false }])
  }

  const removePipingItem = (index: number) => {
    if (pipingItems.length > 1) {
      setPipingItems(pipingItems.filter((_, i) => i !== index))
    }
  }

  const addFloorLevelingItem = () => {
    setFloorLevelingItems([...floorLevelingItems, { location: '', normal: true, defect: false, left_height: '', right_height: '', difference: '' }])
  }

  const removeFloorLevelingItem = (index: number) => {
    if (floorLevelingItems.length > 1) {
      setFloorLevelingItems(floorLevelingItems.filter((_, i) => i !== index))
    }
  }

  const addDrainageItem = () => {
    setDrainageItems([...drainageItems, { location: '', normal: true, defect: false, defect_details: '', remarks: '' }])
  }

  const removeDrainageItem = (index: number) => {
    if (drainageItems.length > 1) {
      setDrainageItems(drainageItems.filter((_, i) => i !== index))
    }
  }

  // 이미지 압축 함수
  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const maxWidth = 1920
        const maxHeight = 1080
        
        let width = img.width
        let height = img.height
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = width * ratio
          height = height * ratio
        }
        
        canvas.width = width
        canvas.height = height
        
        try {
          const result = await pica.resize(img, canvas)
          const blob = await pica.toBlob(result, 'image/jpeg', 0.85)
          resolve(blob)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = reject
    })
  }

  // 기존 데이터 로드
  useEffect(() => {
    loadExistingData()
  }, [])

  const loadExistingData = async () => {
    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) return

    try {
      const { data, error } = await supabase
        .from('reports_equipment')
        .select('*')
        .eq('report_id', reportId)

      if (error) throw error

      // 데이터가 있으면 폼에 채우기
      if (data && data.length > 0) {
        // 라돈 데이터 파싱
        const radonData: RadonItem[] = data
          .filter(item => item.item_name.startsWith('라돈_'))
          .map(item => ({
            location: item.item_name.split('_')[1],
            normal: item.is_checked,
            exceeds_standard: !item.is_checked && !!item.input_text,
            value: item.input_text?.replace(' Pci/L', '') || '',
            image: (item as any).image_url || null
          }))
        if (radonData.length > 0) setRadonItems(radonData)

        // 포름알데히드 데이터 파싱
        const formaldehydeData: FormaldehydeItem[] = data
          .filter(item => item.item_name.startsWith('포름알데히드_'))
          .map(item => ({
            location: item.item_name.split('_')[1],
            normal: item.is_checked,
            exceeds_standard: !item.is_checked && !!item.input_text,
            value: item.input_text?.replace(' ppm', '') || ''
          }))
        if (formaldehydeData.length > 0) setFormaldehydeItems(formaldehydeData)

        // 열화상카메라 데이터 파싱
        const thermalData: ThermalCameraItem[] = data
          .filter(item => item.item_name.startsWith('열화상카메라_'))
          .map(item => {
            const details = item.input_text || ''
            // 이미지 URL 파싱
            const image1Match = details.match(/image1:(https?:\/\/[^\s,]+)/)
            const image2Match = details.match(/image2:(https?:\/\/[^\s,]+)/)
            
            return {
              location: item.item_name.split('_')[1],
              normal: item.is_checked,
              defect: !item.is_checked,
              image1: image1Match ? image1Match[1] : null,
              image2: image2Match ? image2Match[1] : null
            }
          })
        if (thermalData.length > 0) setThermalItems(thermalData)

        // 배관 데이터 파싱
        const pipingData: PipingItem[] = data
          .filter(item => item.item_name.startsWith('배관_'))
          .map(item => {
            const details = item.input_text || ''
            return {
              location: item.item_name.split('_')[1],
              normal: item.is_checked,
              damage: details.includes('파손:true'),
              waste_material: details.includes('폐자재:true'),
              pipe_clog: details.includes('배관막힘:true'),
              other: details.includes('기타:true')
            }
          })
        if (pipingData.length > 0) setPipingItems(pipingData)

        // 바닥수평 데이터 파싱
        const floorLevelingData: FloorLevelingItem[] = data
          .filter(item => item.item_name.startsWith('바닥수평_'))
          .map(item => {
            const details = item.input_text || ''
            const leftHeight = details.match(/좌측:(\d+)mm/)?.[1] || ''
            const rightHeight = details.match(/우측:(\d+)mm/)?.[1] || ''
            const difference = details.match(/차이:(-?\d+)mm/)?.[1] || ''
            return {
              location: item.item_name.split('_')[1],
              normal: item.is_checked,
              defect: !item.is_checked,
              left_height: leftHeight,
              right_height: rightHeight,
              difference
            }
          })
        if (floorLevelingData.length > 0) setFloorLevelingItems(floorLevelingData)

        // 배수역물매 데이터 파싱
        const drainageData: DrainageItem[] = data
          .filter(item => item.item_name.startsWith('배수역물매_'))
          .map(item => {
            const details = item.input_text || ''
            const defectDetails = details.match(/하자내용:([^,]+)/)?.[1] || ''
            const remarks = details.match(/비고:([^,]+)/)?.[1] || ''
            return {
              location: item.item_name.split('_')[1],
              normal: item.is_checked,
              defect: !item.is_checked,
              defect_details: defectDetails,
              remarks
            }
          })
        if (drainageData.length > 0) setDrainageItems(drainageData)
      }
    } catch (error) {
      console.error('Error loading existing data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) {
      alert('보고서 ID를 찾을 수 없습니다.')
      navigate('/basic-info')
      return
    }

    try {
      // 기존 데이터 삭제
      await supabase
        .from('reports_equipment')
        .delete()
        .eq('report_id', reportId)

      // 모든 데이터를 하나의 배열로 합치기
      // 라돈 이미지 업로드
      const radonDataWithImages = await Promise.all(
        radonItems.map(async (item, index) => {
          let imageUrl = ''
          let imagePath = ''
          
          if (item.image) {
            if (item.image instanceof File) {
              // 새 이미지 업로드
              const compressedBlob = await compressImage(item.image)
              const compressedFile = new File([compressedBlob], item.image.name, { type: 'image/jpeg' })
              
              imagePath = `${reportId}/radon_${Date.now()}_${index}_${item.image.name}`
              
              const { error: uploadError } = await supabase.storage
                .from('inspection-images')
                .upload(imagePath, compressedFile)
              
              if (uploadError) throw uploadError
              
              const { data: urlData } = supabase.storage
                .from('inspection-images')
                .getPublicUrl(imagePath)
              
              imageUrl = urlData.publicUrl
            } else {
              // 기존 이미지 URL 사용
              imageUrl = item.image
              imagePath = item.image
            }
          }
          
          return {
            report_id: reportId,
            item_name: `라돈_${item.location}`,
            is_checked: item.normal,
            input_text: `${item.value} Pci/L`,
            image_url: imageUrl,
            image_path: imagePath
          }
        })
      )

      const allEquipmentData = [
        // 라돈 점검 데이터
        ...radonDataWithImages,
        // 포름알데히드 데이터
        ...formaldehydeItems.map(item => ({
          report_id: reportId,
          item_name: `포름알데히드_${item.location}`,
          is_checked: item.normal,
          input_text: `${item.value} ppm`
        })),
        // 열화상카메라 이미지 업로드
        ...(await Promise.all(
          thermalItems.map(async (item, index) => {
            const images = []
            
            // 이미지1 업로드
            if (item.image1) {
              if (item.image1 instanceof File) {
                const compressedBlob = await compressImage(item.image1)
                const compressedFile = new File([compressedBlob], item.image1.name, { type: 'image/jpeg' })
                const imagePath1 = `${reportId}/thermal_${Date.now()}_${index}_1_${item.image1.name}`
                
                const { error: uploadError1 } = await supabase.storage
                  .from('inspection-images')
                  .upload(imagePath1, compressedFile)
                
                if (uploadError1) throw uploadError1
                
                const { data: urlData1 } = supabase.storage
                  .from('inspection-images')
                  .getPublicUrl(imagePath1)
                
                images.push({ url: urlData1.publicUrl, path: imagePath1, type: 'image1' })
              } else {
                images.push({ url: item.image1, path: item.image1, type: 'image1' })
              }
            }
            
            // 이미지2 업로드
            if (item.image2) {
              if (item.image2 instanceof File) {
                const compressedBlob = await compressImage(item.image2)
                const compressedFile = new File([compressedBlob], item.image2.name, { type: 'image/jpeg' })
                const imagePath2 = `${reportId}/thermal_${Date.now()}_${index}_2_${item.image2.name}`
                
                const { error: uploadError2 } = await supabase.storage
                  .from('inspection-images')
                  .upload(imagePath2, compressedFile)
                
                if (uploadError2) throw uploadError2
                
                const { data: urlData2 } = supabase.storage
                  .from('inspection-images')
                  .getPublicUrl(imagePath2)
                
                images.push({ url: urlData2.publicUrl, path: imagePath2, type: 'image2' })
              } else {
                images.push({ url: item.image2, path: item.image2, type: 'image2' })
              }
            }
            
            // 이미지 URL을 input_text에 포함
            const imageUrls = images.map(img => `${img.type}:${img.url}`).join(', ')
            
            return {
              report_id: reportId,
              item_name: `열화상카메라_${item.location}`,
              is_checked: item.normal,
              input_text: imageUrls || '',
              image_url: images[0]?.url || '',
              image_path: images[0]?.path || ''
            }
          })
        )),
        // 배관 육안 점검 데이터
        ...pipingItems.map(item => ({
          report_id: reportId,
          item_name: `배관_${item.location}`,
          is_checked: item.normal,
          input_text: `파손:${item.damage}, 폐자재:${item.waste_material}, 배관막힘:${item.pipe_clog}, 기타:${item.other}`
        })),
        // 바닥 레이저 수평 데이터
        ...floorLevelingItems.map(item => ({
          report_id: reportId,
          item_name: `바닥수평_${item.location}`,
          is_checked: item.normal,
          input_text: `좌측:${item.left_height}mm, 우측:${item.right_height}mm, 차이:${item.difference}mm`
        })),
        // 배수 역물매 데이터
        ...drainageItems.map(item => ({
          report_id: reportId,
          item_name: `배수역물매_${item.location}`,
          is_checked: item.normal,
          input_text: `하자내용:${item.defect_details}, 비고:${item.remarks}`
        }))
      ]

      const { error } = await supabase
        .from('reports_equipment')
        .insert(allEquipmentData)

      if (error) throw error

      navigate('/select-report-type')
    } catch (error) {
      console.error('Error saving equipment data:', error)
      alert('장비점검 데이터 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-300 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            장비점검 보고서
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. 라돈 점검 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">1. 라돈 점검 (RADON EYE)</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">기준치 초과</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">사진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {radonItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleRadonChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {radonItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRadonItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handleRadonChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.exceeds_standard}
                            onChange={(e) => handleRadonChange(index, 'exceeds_standard', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <div className="space-y-2">
                            {item.image ? (
                              <div className="relative">
                                <img
                                  src={item.image instanceof File ? URL.createObjectURL(item.image) : item.image}
                                  alt="라돈 측정 결과"
                                  className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRadonChange(index, 'image', null)}
                                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                                  <div className="text-2xl text-gray-400 mb-1">📷</div>
                                  <span className="text-xs text-gray-500">사진 업로드</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      handleRadonChange(index, 'image', file)
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addRadonItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <div>
                <p><strong>※ Pci/L 기준치:</strong></p>
                <p>- 1.3Pci/L 일반 가정집 실내환경 기준치</p>
                <p>- 2.7Pci/L WHO 다중 이용시설 실내 공기질 기준치</p>
                <p>- 4.0Pci/L 우리나라 다중 이용시설 실내 공기질 기준치(하방 기준치)</p>
                </div>
                <div className="mt-2">
                <p ><strong>※ Bq/㎡ 기준치:</strong></p>
                <p>- 48.00 Bq/m² 일반 가정집 실내환경 기준치</p>
                <p>- 100.00 Bq/m² WHO 다중 이용시설 실내 공기질 기준치</p>
                <p>- 148.00 Bq/m² 우리나라 다중 이용시설 실내 공기질 기준치(하방 기준치)</p>
                </div>
                <div className="mt-2">
                <p ><strong>※ 라돈이란?</strong></p>
                <p>- 라돈은 무색무취의 자연방사능 물질로 세계보건기구(WHO)에서 1급 발암물질로 규정하는 흡연 다음으로 폐암을 발생시키는 주요 원인으로 규정 하고 있습니다.</p>
                </div>
              </div>
            </section>

            {/* 2. 포름알데히드 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">2. 포름알데히드</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-3 text-medium">항목</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">기준치 초과</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">HCHO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formaldehydeItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleFormaldehydeChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {formaldehydeItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFormaldehydeItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handleFormaldehydeChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.exceeds_standard}
                            onChange={(e) => handleFormaldehydeChange(index, 'exceeds_standard', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.value}
                            onChange={(e) => handleFormaldehydeChange(index, 'value', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          /><span className="text-sm text-gray-500 ml-2">ppm</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addFormaldehydeItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600 space-y-2">
                <p><strong>※ HCHO(포름알데히드) 기준치:</strong></p>
                <p>- 0.01ppm 정상</p>
                <p>- 0.08ppm 우리나라 다중 이용시설 실내 공기질 기준치(12.01.01) & WHO 기준</p>
                <p>- 0.16ppm 우리나라 신축 공동 주택 권고 기준치</p>
                <p>- 0.50ppm 독의 자극이 시작되는 최저치 산업위생학회 형용농도(공장등의 최고치)</p>
              </div>
            </section>

            {/* 3. 열화상카메라 점검 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">3. 열화상카메라 점검</h2>
              <p className="text-sm text-gray-600 mb-2">* 창문을 기준으로 좌/우측 측정. 10도 이상 차이 발생시 하자로 판정</p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-3 text-medium">항목</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">사진</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thermalItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleThermalChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {thermalItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeThermalItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handleThermalChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.defect}
                            onChange={(e) => handleThermalChange(index, 'defect', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="grid grid-cols-2 gap-2">
                              {/* 사진 1 */}
                              <div>
                                {item.image1 ? (
                                  <div className="relative">
                                    <img
                                      src={item.image1 instanceof File ? URL.createObjectURL(item.image1) : item.image1}
                                      alt="열화상 사진 1"
                                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleThermalChange(index, 'image1', null)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors">
                                      <div className="text-xl text-gray-400 mb-1">📷</div>
                                      <span className="text-xs text-gray-500">사진 1</span>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleThermalChange(index, 'image1', file)
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                              {/* 사진 2 */}
                              <div>
                                {item.image2 ? (
                                  <div className="relative">
                                    <img
                                      src={item.image2 instanceof File ? URL.createObjectURL(item.image2) : item.image2}
                                      alt="열화상 사진 2"
                                      className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleThermalChange(index, 'image2', null)}
                                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 text-xs"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer block">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 text-center hover:border-gray-400 transition-colors">
                                      <div className="text-xl text-gray-400 mb-1">📷</div>
                                      <span className="text-xs text-gray-500">사진 2</span>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handleThermalChange(index, 'image2', file)
                                        }
                                      }}
                                      className="hidden"
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addThermalItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
            </section>

            {/* 4. 배관 육안 점검 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">4. 배관 육안 점검</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-3 text-center">항목</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pipingItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handlePipingChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {pipingItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePipingItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handlePipingChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <div className="flex justify-evenly space-x-1">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.damage}
                                onChange={(e) => handlePipingChange(index, 'damage', e.target.checked)}
                                className="w-4 h-4 mr-1"
                              />
                              파손
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.waste_material}
                                onChange={(e) => handlePipingChange(index, 'waste_material', e.target.checked)}
                                className="w-4 h-4 mr-1"
                              />
                              폐자재
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.pipe_clog}
                                onChange={(e) => handlePipingChange(index, 'pipe_clog', e.target.checked)}
                                className="w-4 h-4 mr-1"
                              />
                              배관막힘
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={item.other}
                                onChange={(e) => handlePipingChange(index, 'other', e.target.checked)}
                                className="w-4 h-4 mr-1"
                              />
                              기타
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addPipingItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
            </section>

            {/* 5. 바닥 레이저 수평 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">5. 바닥 레이저 수평</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
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
                    {floorLevelingItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleFloorLevelingChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {floorLevelingItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFloorLevelingItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handleFloorLevelingChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.defect}
                            onChange={(e) => handleFloorLevelingChange(index, 'defect', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.left_height}
                            onChange={(e) => handleFloorLevelingChange(index, 'left_height', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="ml-1 text-sm">mm</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="text"
                            value={item.right_height}
                            onChange={(e) => handleFloorLevelingChange(index, 'right_height', e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                          <span className="ml-1 text-sm">mm</span>
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center font-medium">
                          {item.difference}mm
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addFloorLevelingItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p><strong>※ 바닥 단차 기준치</strong></p>
                <p>- 바닥 수평 허용 오차 범위 ± 10mm 이내(하방 기준)</p>
              </div>
            </section>

            {/* 6. 욕실 및 발코니 바닥 타일 배수 역물매 점검 */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-4">6. 욕실 및 발코니 바닥 타일 배수 역물매 점검</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-gray-300 px-4 py-3 text-left">항목</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">정상</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">하자</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">세부내용(하자내용)</th>
                      <th className="border border-gray-300 px-4 py-3 text-center">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drainageItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-3">
                          <input
                            type="text"
                            value={item.location}
                            onChange={(e) => handleDrainageChange(index, 'location', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                            placeholder="항목 입력"
                          />
                          {drainageItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDrainageItem(index)}
                              className="mt-1 text-red-500 hover:text-red-700 text-sm block mx-auto"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.normal}
                            onChange={(e) => handleDrainageChange(index, 'normal', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.defect}
                            onChange={(e) => handleDrainageChange(index, 'defect', e.target.checked)}
                            className="w-5 h-5"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <input
                            type="text"
                            value={item.defect_details}
                            onChange={(e) => handleDrainageChange(index, 'defect_details', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="하자 내용"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-3">
                          <input
                            type="text"
                            value={item.remarks}
                            onChange={(e) => handleDrainageChange(index, 'remarks', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                            placeholder="비고"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={addDrainageItem}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                  >
                    + 항목 추가
                  </button>
                </div>
              </div>
            </section>

            {/* 버튼 */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => navigate('/select-report-type')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                이전
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {loading ? '저장 중...' : '장비점검 보고서 제출'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



