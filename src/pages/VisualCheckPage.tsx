import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Pica from 'pica'

interface VisualCheckFormItem {
  space_item: string
  title: string
  content: string
  fullImage: File | string | null
  closeupImage: File | string | null
  angleImage: File | string | null
  location: string
  classification: string
  details: string
}

// 하자 위치별 분류 옵션
const locationClassifications: Record<string, string[]> = {
  '거실': [
    '마루/타일','걸레받이','난방배관','내장목공사','단열','스위치','도배(벽지)','유리','일반가구','줄눈','코킹','PVC창호',
    '환기/공조','몰딩','난간대','세대등기구','스프링클러헤드','아트월','장식장','홈오토시스템',
    
  ],
  '주방': [
    '가스감지기(자동식소화기일체)', '내장목공사', '냉온수계량기', '냉장고',
    '도배(벽지)', '렌지후드', '세대등기구', '스프링클러헤드', '마루/타일','줄눈','코킹',
    '온수분배기', '인덕션쿡탑', '자동제어밸브', '장비기타(전기)',
    '주방가구', '주방상판','단열','도배(벽지)','유리','일반가구','PVC창호'
  ],
  '침실1': [
    '내장목공사', '도배(벽지)', '목문', '스프링클러헤드', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련'
  ],
  '침실2': [
    '내장목공사', '도배(벽지)', '목문', '스프링클러헤드', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련'
  ],
  '침실3': [
    '내장목공사', '도배(벽지)', '목문', '스프링클러헤드', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련'
  ],
  '침실4': [
    '내장목공사', '도배(벽지)', '목문', '스프링클러헤드', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련'
  ],
  '현관': [
    '현관문', '신발장', '내장목공사', '도배(벽지)', '줄눈', '코킹', '도장', '디지털도어록',
    '몰딩', '미장', '석재', '센서등', '일광소등', '타일', '중문', '스위치', '스프링클러헤드'
  ],
  '현관창고': [
    '타일', '선반', '내장목공사', '도배(벽지)', '몰딩', '미장', '줄눈','코킹','세대등기구','스위치','스프링클러헤드','통신단자함'
  ],
  '복도': [
    '내장목공사', '도배(벽지)', '일반가구', '코킹', 'PVC창호','몰딩',
    '마루/타일일','세대등기구','스위치','스프링클러헤드','줄눈'
  ],
  '파우더룸': [
    '화장대', '거울', '내장목공사', '도배(벽지)', '거울','코킹','세대등기구','스위치'
  ],
  '드레스룸': [
    '거울', '내장목공사','단열','도배(벽지)', '환기/공조 관련', '무늬목판넬', '스위치',
    '시스템가구', '온돌마루판', '일반가구', '전기민원', '도어', '세대등기구','스프링클러헤드'
  ],
  '침실1발코니': [
    '도장', '미장', '발코니난간대', '방수', '배수구(바닥드레인)', '분합창',
    '빨래건조대', '선홈통', '설비민원', '세대등기구', '수전금구류', '유리',
    '전기민원', '코킹', '콘크리트', '타일', 'PVC창호','줄눈'
  ],
  '대피공간': [
    '타일', '단열', '도장', '미장', '방수', '세대등기구', '유리','피난사다리','줄눈',
    'pvc창호',
  ],
  '다용도실': [
    '가스계량기', '가스배관', '경량칸막이', '도장', '동체감지기등', '목문틀','미장','방수','세대등기구',
    '배수구(바닥드레인','보일러','선홈통','설비민원', '수전금구류','스위치','시스템가구','유리','주방가구','주방상판','코킹',
    '콘센트','콘트리트','타일','터닝도어','통신단자함','PVC창호','줄눈'
  ],
  '팬트리': [
    '도어', '선반', '도배(벽지)', '유리', '일반가구', '코킹','몰딩','바닥재','스위치','세대등기구','스프링클러헤드'
  ],
  '실외기실': [
    '도장', '미장', '방수', '유리', '코킹','타일','세대등기구','스위치','줄눈'
  ],
  '알파룸': [
     '내장목공사', '도배(벽지)', '목문', '스프링클러헤드', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련'
  ],
  '욕실1' :[
    '목문','목문틀','미장','방수','배수구(바닥드레인)','세대등기구','세면기','수전금구류','스위치',
    '양변기','욕실비누턱(젠다이)','욕실악세서리','욕실장','환풍기','욕조','코킹','타일','줄눈','코킹'
  ],
  '욕실2' :[
    '목문','목문틀','미장','방수','배수구(바닥드레인)','세대등기구','세면기','수전금구류','스위치',
    '양변기','욕실비누턱(젠다이)','욕실악세서리','욕실장','환풍기','욕조','코킹','타일','줄눈','코킹'
  ]
  
}

export default function VisualCheckPage() {
  const navigate = useNavigate()
  const [formItems, setFormItems] = useState<VisualCheckFormItem[]>([
    {
      space_item: '',
      title: '',
      content: '',
      fullImage: null,
      closeupImage: null,
      angleImage: null,
      location: '',
      classification: '',
      details: ''
    }
  ])
  const [loading, setLoading] = useState(false)
  const pica = new Pica()

  // 기존 데이터 로드
  useEffect(() => {
    loadExistingData()
  }, [])

  const loadExistingData = async () => {
    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) return

    try {
      const { data, error } = await supabase
        .from('reports_visual')
        .select('*')
        .eq('report_id', reportId)

      if (error) throw error

      if (data && data.length > 0) {
        // location + classification + details로 그룹화
        const grouped = data.reduce((acc, item) => {
          const key = `${item.location}_${item.classification}_${item.details}`
          if (!acc[key]) {
            acc[key] = {
              location: item.location,
              classification: item.classification,
              details: item.details,
              fullImage: null,
              closeupImage: null,
              angleImage: null
            }
          }
          if (item.image_type === 'full') {
            acc[key].fullImage = item.image_url
          } else if (item.image_type === 'closeup') {
            acc[key].closeupImage = item.image_url
          } else if (item.image_type === 'angle') {
            acc[key].angleImage = item.image_url
          }
          return acc
        }, {} as Record<string, any>)

        // 폼 아이템으로 변환
        const items = Object.values(grouped).map((group: any) => ({
          space_item: '',
          title: '',
          content: '',
          fullImage: group.fullImage,
          closeupImage: group.closeupImage,
          angleImage: group.angleImage,
          location: group.location,
          classification: group.classification,
          details: group.details
        }))

        setFormItems(items)
      }
    } catch (error) {
      console.error('Error loading existing data:', error)
    }
  }

  const addFormItem = () => {
    setFormItems([...formItems, {
      space_item: '',
      title: '',
      content: '',
      fullImage: null,
      closeupImage: null,
      angleImage: null,
      location: '',
      classification: '',
      details: ''
    }])
  }

  const removeFormItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index))
    }
  }

  const updateFormItem = (index: number, field: keyof VisualCheckFormItem, value: string) => {
    const newFormItems = [...formItems]
    newFormItems[index] = { ...newFormItems[index], [field]: value }
    
    // 하자 위치가 변경되면 하자 분류 초기화
    if (field === 'location') {
      newFormItems[index].classification = ''
    }
    
    setFormItems(newFormItems)
  }

  const updateFormItemImages = (index: number, files: File[]) => {
    // 최대 2장만 허용
    const selectedFiles = files.slice(0, 2)
    
    // 2장 이상 선택 시 경고
    if (files.length > 2) {
      alert('사진은 최대 2장까지만 선택 가능합니다.\n첫 번째 사진은 전체 사진, 두 번째 사진은 확대 사진으로 저장됩니다.')
    }
    
    const newFormItems = [...formItems]
    newFormItems[index] = {
      ...newFormItems[index],
      fullImage: selectedFiles[0] || null,
      closeupImage: selectedFiles[1] || null,
      angleImage: null
    }
    setFormItems(newFormItems)
  }

  const removeImage = (index: number, imageType: 'fullImage' | 'closeupImage' | 'angleImage') => {
    const newFormItems = [...formItems]
    newFormItems[index] = {
      ...newFormItems[index],
      [imageType]: null
    }
    setFormItems(newFormItems)
  }

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


  // 임시저장 기능
  const handleSaveDraft = async () => {
    setLoading(true)
    const reportId = localStorage.getItem('current_report_id')
    if (!reportId) {
      alert('보고서 ID를 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    try {
      // 기존 데이터 삭제
      const { data: existingData } = await supabase
        .from('reports_visual')
        .select('image_path')
        .eq('report_id', reportId)

      if (existingData) {
        for (const item of existingData) {
          await supabase.storage
            .from('inspection-images')
            .remove([item.image_path])
        }
      }

      await supabase
        .from('reports_visual')
        .delete()
        .eq('report_id', reportId)

      // 완전한 항목만 저장
      const validFormItems = formItems.filter(form => 
        form.location && 
        form.classification && 
        form.details.trim() && 
        form.fullImage && 
        form.closeupImage
      )

      // 유효한 항목이 없으면 경고
      if (validFormItems.length === 0) {
        alert('임시저장할 완전한 하자 정보가 없습니다.')
        setLoading(false)
        return
      }

      // 데이터 저장
      for (let index = 0; index < validFormItems.length; index++) {
        const form = validFormItems[index]

        const images = [
          { file: form.fullImage, type: 'full' },
          { file: form.closeupImage, type: 'closeup' }
        ].filter(item => item.file !== null) as { file: File | string, type: string }[]
        
        for (const { file: image, type } of images) {
          let fileName = ''
          let imageUrl = ''
          
          if (image instanceof File) {
            const compressedBlob = await compressImage(image)
            const compressedFile = new File([compressedBlob], image.name, { type: 'image/jpeg' })
            
            fileName = `${reportId}/${Date.now()}_${index}_${type}_${image.name}`
            
            const { error: uploadError } = await supabase.storage
              .from('inspection-images')
              .upload(fileName, compressedFile)

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
              .from('inspection-images')
              .getPublicUrl(fileName)
            
            imageUrl = urlData.publicUrl
          } else {
            imageUrl = image
            fileName = image
          }

          await supabase
            .from('reports_visual')
            .insert({
              report_id: reportId,
              space_item: form.space_item,
              title: form.title,
              content: form.content,
              image_path: fileName,
              image_url: imageUrl,
              image_type: type,
              location: form.location,
              classification: form.classification,
              details: form.details
            })
        }
      }

      alert('임시저장이 완료되었습니다.')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('임시저장에 실패했습니다.')
    } finally {
      setLoading(false)
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
      const { data: existingData } = await supabase
        .from('reports_visual')
        .select('image_path')
        .eq('report_id', reportId)

      if (existingData) {
        // 스토리지에서 이미지 삭제
        for (const item of existingData) {
          await supabase.storage
            .from('inspection-images')
            .remove([item.image_path])
        }
      }

      await supabase
        .from('reports_visual')
        .delete()
        .eq('report_id', reportId)

      // 빈 항목 자동 필터링 - 필수 항목이 모두 입력된 항목만 처리
      const validFormItems = formItems.filter(form => 
        form.location && 
        form.classification && 
        form.details.trim() && 
        form.fullImage && 
        form.closeupImage
      )

      // 유효한 항목이 없으면 경고
      if (validFormItems.length === 0) {
        alert('최소 1개 이상의 완전한 하자 정보를 입력해주세요.\n(위치, 분류, 내용, 전체사진, 확대사진 모두 입력 필요)')
        setLoading(false)
        return
      }

      // 입력된 항목과 전체 항목 수가 다르면 안내
      if (validFormItems.length < formItems.length) {
        const skippedCount = formItems.length - validFormItems.length
        if (!confirm(`${skippedCount}개의 불완전한 항목이 있습니다. 완성된 항목만 저장하고 계속하시겠습니까?`)) {
          setLoading(false)
          return
        }
      }

      for (let index = 0; index < validFormItems.length; index++) {
        const form = validFormItems[index]

        const images = [
          { file: form.fullImage, type: 'full' },
          { file: form.closeupImage, type: 'closeup' },
          { file: form.angleImage, type: 'angle' }
        ].filter(item => item.file !== null) as { file: File | string, type: string }[]
        
        for (const { file: image, type } of images) {
          let fileName = ''
          let imageUrl = ''
          
          // 이미지가 File 타입인 경우 (새로 업로드)
          if (image instanceof File) {
            // 이미지 압축
            const compressedBlob = await compressImage(image)
            const compressedFile = new File([compressedBlob], image.name, { type: 'image/jpeg' })
            
            // Supabase Storage에 업로드
            fileName = `${reportId}/${Date.now()}_${index}_${type}_${image.name}`
            console.log('Uploading to bucket: inspection-images')
            console.log('File name:', fileName)
            console.log('File size:', compressedFile.size)
            
            const { error: uploadError } = await supabase.storage
              .from('inspection-images')
              .upload(fileName, compressedFile)

            if (uploadError) throw uploadError

            // Public URL 가져오기
            const { data: urlData } = supabase.storage
              .from('inspection-images')
              .getPublicUrl(fileName)
            
            imageUrl = urlData.publicUrl
          } else {
            // 이미지가 string 타입인 경우 (기존 이미지)
            imageUrl = image
            fileName = image // URL을 그대로 사용
          }

          // DB에 저장
          const { error: dbError } = await supabase
            .from('reports_visual')
            .insert({
              report_id: reportId,
              space_item: form.space_item,
              title: form.title,
              content: form.content,
              image_path: fileName,
              image_url: imageUrl,
              image_type: type,
              location: form.location,
              classification: form.classification,
              details: form.details
            })

          if (dbError) throw dbError
        }
      }

      navigate('/select-report-type')
    } catch (error) {
      console.error('Error saving visual check data:', error)
      alert('육안점검 데이터 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-blue-300 py-8 px-4">
      <div className="max-w-4xl mx-auto ">
        <div className="bg-white rounded-lg shadow-md px-10 py-10 ">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
             육안점검 보고서 작성
            </h1>
            <div className="flex items-center text-red-500">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              <span className="text-sm font-medium">필수항목</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formItems.map((form, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">하자 정보 {index + 1}</h3>
                  {formItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeFormItem(index)}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      삭제
                    </button>
                  )}
                </div>

                {/* 하자 정보 섹션 */}
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        하자 위치 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.location}
                        onChange={(e) => updateFormItem(index, 'location', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">선택</option>
                        <option value="현관">현관</option>
                        <option value="현관창고">현관창고</option>
                        <option value="복도">복도</option>
                        <option value="침실3">침실3</option>
                        <option value="침실2">침실2</option>
                        <option value="침실1">침실1</option>
                        <option value="파우더룸">파우더룸</option>
                        <option value="드레스룸">드레스룸</option>
                        <option value="침실1발코니">침실1발코니</option>
                        <option value="대피공간">대피공간</option>
                        <option value="거실">거실</option>
                        <option value="주방">주방</option>
                        <option value="다용도실">다용도실</option>
                        <option value="팬트리">팬트리</option>
                        <option value="침실4">침실4</option>
                        <option value="실외기실">실외기실</option>
                        <option value="알파룸">알파룸</option>
                        <option value="욕실1">욕실1</option>
                        <option value="욕실2">욕실2</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        하자 분류 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.classification}
                        onChange={(e) => updateFormItem(index, 'classification', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        disabled={!form.location}
                      >
                        <option value="">
                          {form.location ? '하자 분류를 선택하세요' : '하자 위치를 먼저 선택하세요'}
                        </option>
                        {form.location && locationClassifications[form.location]?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      세부 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.details}
                      onChange={(e) => updateFormItem(index, 'details', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="상세 설명"
                    />
                  </div>
                </div>

                {/* 이미지 업로드 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* 전체 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      전체 사진 <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                    >
                      {form.fullImage ? (
                        <div className="relative">
                          <img
                            src={form.fullImage instanceof File ? URL.createObjectURL(form.fullImage) : form.fullImage}
                            alt="전체 사진"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage(index, 'fullImage')
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-2xl text-gray-400">📷</div>
                          <p className="text-xs text-gray-500">전체 사진</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 확대 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      확대 사진 <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById(`image-upload-${index}`)?.click()}
                    >
                      {form.closeupImage ? (
                        <div className="relative">
                          <img
                            src={form.closeupImage instanceof File ? URL.createObjectURL(form.closeupImage) : form.closeupImage}
                            alt="확대 사진"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeImage(index, 'closeupImage')
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-2xl text-gray-400">📷</div>
                          <p className="text-xs text-gray-500">확대 사진</p>
                        </div>
                      )}
                    </div>
                  </div>

               
                </div>

                {/* 이미지 업로드 버튼 */}
                <div className="text-center mt-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        updateFormItemImages(index, Array.from(files))
                      }
                    }}
                    className="hidden"
                    id={`image-upload-${index}`}
                  />
                </div>
              </div>
            ))}

            {/* + 추가 버튼 */}
            <div className="text-center">
              <button
                type="button"
                onClick={addFormItem}
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                + 하자 정보 추가
              </button>
            </div>

            {/* 안내 문구 */}
            <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">📌 안내사항</p>
              <p>* 사진은 최대 2장까지만 선택 가능합니다 (전체사진, 확대사진)</p>
              <p>* 사진은 5MB미만의 용량 파일만 등록이 가능합니다.</p>
            </div>

            {/* 버튼 */}
            <div className="flex justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate('/select-report-type')}
                className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
              >
                이전
              </button>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                >
                  {loading ? '저장 중...' : '임시저장'}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
                >
                  {loading ? '저장 중...' : '완료'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}



