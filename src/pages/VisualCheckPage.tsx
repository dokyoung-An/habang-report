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

// 하자 위치 목록 (드롭다운에 표시될 옵션들)
const predefinedLocations = [
  '현관', '현관창고', '복도', '침실3', '침실2', '침실1', '파우더룸', '드레스룸', 
  '침실1발코니', '대피공간', '거실', '주방', '다용도실', '팬트리', '침실4', 
  '실외기실', '알파룸', '욕실1', '욕실2'
]

// 하자 위치별 분류 옵션
const locationClassifications: Record<string, string[]> = {
  '거실': [
    '마루/타일','걸레받이','난방배관','석고보드','단열','스위치','도배','유리','일반가구','줄눈','코킹','PVC창호',
    '환기/공조','몰딩','난간대','세대등기구','스프링클러','아트월','장식장','홈오토시스템','기타'
    
  ],
  '주방': [
    '가스감지기(자동식소화기일체)', '석고보드', '냉온수계량기', '냉장고',
    '도배', '렌지후드', '세대등기구', '스프링클러', '마루/타일','줄눈','코킹',
    '온수분배기', '인덕션쿡탑', '자동제어밸브', '콘센트',
    '주방가구', '주방상판','단열','도배','유리','일반가구','PVC창호','기타'
  ],
  '침실1': [
    '석고보드', '도배', '목문', '스프링클러', '마루','걸레받이','도장','미장',
    '일반가구', '콘센트', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '침실2': [
    '석고보드', '도배', '목문', '스프링클러', '마루','걸레받이','도장','미장',
    '일반가구', '콘센트', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '침실3': [
    '석고보드', '도배', '목문', '스프링클러', '마루','걸레받이','도장','미장',
    '일반가구', '콘센트', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '침실4': [
    '석고보드', '도배', '목문', '스프링클러', '마루','걸레받이','도장','미장',
    '일반가구', '콘센트', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '침실5': [
    '석고보드', '도배', '목문', '스프링클러', '마루','걸레받이','도장','미장',
    '일반가구', '콘센트', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '현관': [
    '현관문', '신발장', '석고보드', '도배', '줄눈', '코킹', '도장', '디지털도어록',
    '몰딩', '미장', '석재', '센서등', '일광소등', '타일', '중문', '스위치', '스프링클러','기타'
  ],
  '현관창고': [
    '타일', '선반','도장','미장', '석고보드', '도배', '몰딩', '미장', '줄눈','코킹','세대등기구','스위치','스프링클러','통신단자함','기타'
  ],
  '복도': [
    '석고보드', '도배', '일반가구', '코킹','몰딩',
    '마루','타일','일괄소등스위치','세대등기구','스위치','스프링클러','줄눈','기타'
  ],
  '파우더룸': [
    '화장대', '거울', '석고보드', '도배','코킹','세대등기구','스위치','일반가구','석재','기타'
  ],
  '드레스룸': [
    '거울', '석고보드','단열','도배', '환기/공조 관련', '무늬목판넬', '스위치','목창호','PVC창호',
    '시스템가구', '온돌마루판', '일반가구', '도어', '세대등기구','스프링클러','기타'
  ],
  '침실1발코니': [
    '도장', '미장', '방수', '배수구(바닥드레인)', '분합창',
    '빨래건조대', '선홈통','세대등기구', '수전금구류', '유리','콘센트',
    '코킹', '타일', 'PVC창호','줄눈','기타'
  ],
  '대피공간': [
    '타일', '도장', '미장', '방수', '세대등기구','피난사다리','줄눈','방화문','완강기',
    'pvc창호','기타'
  ],
  '다용도실': [
    '가스계량기', '가스배관', '경량칸막이', '도장', '동체감지기등', '목문틀','미장','방수','세대등기구',
    '배수구(바닥드레인)','보일러','선홈통', '수전금구류','스위치','코킹',
    '콘센트','타일','터닝도어','PVC창호','줄눈','기타'
  ],
  '팬트리': [
    '도어', '도배', '유리', '일반가구', '코킹','몰딩','바닥재','스위치','세대등기구','스프링클러','목창호','기타'
  ],
  '실외기실': [
    '도장', '미장', '방수', '코킹','타일','세대등기구','스위치','줄눈','루버창','방화문','선홈통','기타'
  ],
  '알파룸': [
     '내장목공사', '도배', '목문', '스프링클러', '바닥재','걸레받이',
    '일반가구', '장비기타(전기)', 'PVC창호','몰딩','스위치','코킹','세대등기구','환기/공조 관련','기타'
  ],
  '욕실1' :[
    '목문','목문틀','미장','배수구(바닥드레인)','세대등기구','세면기','수전금구류','스위치','천장돔','천장돔내부배관','단열재',
    '양변기','욕실비누턱(젠다이)','욕실악세서리','욕실장','환풍기','욕조','코킹','타일','줄눈','기타'
  ],
  '욕실2' :[
    '목문','목문틀','미장','배수구(바닥드레인)','세대등기구','세면기','수전금구류','스위치','천장돔','천장돔내부배관','단열재',
    '양변기','욕실비누턱(젠다이)','욕실악세서리','욕실장','환풍기','욕조','코킹','타일','줄눈','기타'
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
    // 파일 검증
    const invalidFiles: string[] = []
    const validFiles: File[] = []
    
    for (const file of files) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      } else {
        validFiles.push(file)
      }
    }
    
    // 유효하지 않은 파일이 있으면 알림
    if (invalidFiles.length > 0) {
      alert(`❌ 다음 파일을 업로드할 수 없습니다:\n\n${invalidFiles.join('\n')}`)
    }
    
    // 최대 2장만 허용
    const selectedFiles = validFiles.slice(0, 2)
    
    // 2장 이상 선택 시 경고
    if (validFiles.length > 2) {
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

  // 단일 이미지 업로드 (각 영역에서 1장씩)
  const handleSingleImageUpload = async (index: number, imageType: 'fullImage' | 'closeupImage', file: File) => {
    // 파일 검증
    const validation = validateImageFile(file)
    if (!validation.valid) {
      alert(`❌ ${validation.error}`)
      return
    }
    
    const newFormItems = [...formItems]
    newFormItems[index] = {
      ...newFormItems[index],
      [imageType]: file
    }
    setFormItems(newFormItems)
  }

  // 사진 추가 버튼 클릭 핸들러
  const handleAddPhotos = () => {
    const input = document.getElementById('bulk-photo-upload') as HTMLInputElement
    input?.click()
  }

  // 여러 사진 선택 시 처리 (2개씩 묶어서 form item 추가)
  const handlePhotosSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // 파일 검증
    const fileArray = Array.from(files)
    const invalidFiles: string[] = []
    const validFiles: File[] = []
    
    for (const file of fileArray) {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        invalidFiles.push(`${file.name}: ${validation.error}`)
      } else {
        validFiles.push(file)
      }
    }
    
    // 유효하지 않은 파일이 있으면 알림
    if (invalidFiles.length > 0) {
      alert(`❌ 다음 파일을 업로드할 수 없습니다:\n\n${invalidFiles.join('\n')}\n\n유효한 파일만 업로드됩니다.`)
    }
    
    // 유효한 파일이 없으면 종료
    if (validFiles.length === 0) {
      e.target.value = ''
      return
    }

    const updatedFormItems = [...formItems]
    let fileIndex = 0

    // 첫 번째 form item이 비어있으면 먼저 채우기
    if (updatedFormItems.length > 0 && 
        !updatedFormItems[0].fullImage && 
        !updatedFormItems[0].closeupImage && 
        validFiles.length > 0) {
      updatedFormItems[0] = {
        ...updatedFormItems[0],
        fullImage: validFiles[fileIndex] || null,
        closeupImage: validFiles[fileIndex + 1] || null,
        angleImage: null
      }
      fileIndex += 2
    }

    // 남은 사진들로 새로운 form item 생성 (2개씩 묶어서)
    const newItems: VisualCheckFormItem[] = []
    for (let i = fileIndex; i < validFiles.length; i += 2) {
      newItems.push({
        space_item: '',
        title: '',
        content: '',
        fullImage: validFiles[i] || null,
        closeupImage: validFiles[i + 1] || null,
        angleImage: null,
        location: '',
        classification: '',
        details: ''
      })
    }

    // 업데이트된 form items와 새로운 항목들 합치기
    setFormItems([...updatedFormItems, ...newItems])

    // input 초기화 (같은 파일을 다시 선택할 수 있도록)
    if (e.target) {
      e.target.value = ''
    }
  }

  // 파일 유효성 검증 함수
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // 파일 크기 검증 (50MB = 50 * 1024 * 1024 bytes)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return { valid: false, error: `파일 크기가 너무 큽니다. (최대 50MB, 현재: ${(file.size / 1024 / 1024).toFixed(2)}MB)` }
    }

    // 파일 형식 검증 (핸드폰 카메라 형식 포함)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    // 일부 브라우저에서는 file.type이 비어있을 수 있으므로 확장자도 확인
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => fileName.endsWith(ext))
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      return { valid: false, error: `지원하지 않는 파일 형식입니다. (JPEG, PNG, WEBP, GIF만 가능)` }
    }

    return { valid: true }
  }

  const compressImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // 파일 유효성 검증
      const validation = validateImageFile(file)
      if (!validation.valid) {
        reject(new Error(validation.error))
        return
      }

      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.src = objectUrl
      
      img.onload = async () => {
        try {
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
          
          const result = await pica.resize(img, canvas)
          const blob = await pica.toBlob(result, 'image/jpeg', 0.85)
          
          // 메모리 정리
          URL.revokeObjectURL(objectUrl)
          
          resolve(blob)
        } catch (error) {
          URL.revokeObjectURL(objectUrl)
          reject(error)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('이미지를 로드할 수 없습니다. 지원하는 이미지 형식(JPEG, PNG 등)인지 확인해주세요.'))
      }
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

      // 완전한 항목만 저장 (10자 이상 검증 포함)
      const validFormItems = formItems.filter(form => 
        form.location && 
        form.classification && 
        form.details.trim() && 
        form.details.trim().length >= 10 &&
        form.fullImage && 
        form.closeupImage
      )

      // 유효한 항목이 없으면 경고
      if (validFormItems.length === 0) {
        const hasIncompleteDetails = formItems.some(form => 
          form.details.trim() && form.details.trim().length < 10
        )
        if (hasIncompleteDetails) {
          alert('임시저장할 완전한 하자 정보가 없습니다.\n세부 내용은 10자 이상 입력해야 합니다.')
        } else {
          alert('임시저장할 완전한 하자 정보가 없습니다.')
        }
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

      // 빈 항목 자동 필터링 - 필수 항목이 모두 입력된 항목만 처리 (10자 이상 검증 포함)
      const validFormItems = formItems.filter(form => 
        form.location && 
        form.classification && 
        form.details.trim() && 
        form.details.trim().length >= 10 &&
        form.fullImage && 
        form.closeupImage
      )

      // 유효한 항목이 없으면 경고
      if (validFormItems.length === 0) {
        const hasIncompleteDetails = formItems.some(form => 
          form.details.trim() && form.details.trim().length < 10
        )
        if (hasIncompleteDetails) {
          alert('최소 1개 이상의 완전한 하자 정보를 입력해주세요.\n(위치, 분류, 내용 10자 이상, 전체사진, 확대사진 모두 입력 필요)')
        } else {
          alert('최소 1개 이상의 완전한 하자 정보를 입력해주세요.\n(위치, 분류, 내용, 전체사진, 확대사진 모두 입력 필요)')
        }
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
            try {
              // 이미지 압축
              const compressedBlob = await compressImage(image)
              const compressedFile = new File([compressedBlob], image.name, { type: 'image/jpeg' })
              
              // Supabase Storage에 업로드
              fileName = `${reportId}/${Date.now()}_${index}_${type}_${image.name}`
              console.log(`[육안점검 ${index} ${type}] 업로드 시작: ${image.name} (${(compressedFile.size / 1024).toFixed(2)}KB)`)
              
              const { error: uploadError } = await supabase.storage
                .from('inspection-images')
                .upload(fileName, compressedFile)

              if (uploadError) {
                console.error(`[육안점검 ${index} ${type}] 업로드 실패:`, uploadError)
                throw new Error(`이미지 업로드 실패 (${form.location} ${type}): ${uploadError.message}`)
              }

              // Public URL 가져오기
              const { data: urlData } = supabase.storage
                .from('inspection-images')
                .getPublicUrl(fileName)
              
              imageUrl = urlData.publicUrl
              console.log(`[육안점검 ${index} ${type}] 업로드 완료`)
            } catch (error) {
              console.error(`[육안점검 ${index} ${type}] 에러:`, error)
              throw new Error(`이미지 업로드 실패 (${form.location} ${type}): ${error instanceof Error ? error.message : String(error)}`)
            }
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
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      
      // 더 자세한 에러 메시지 표시
      if (errorMessage.includes('파일 크기')) {
        alert(`❌ 이미지 업로드 실패\n\n${errorMessage}\n\n더 작은 크기의 이미지를 사용해주세요.`)
      } else if (errorMessage.includes('파일 형식')) {
        alert(`❌ 이미지 업로드 실패\n\n${errorMessage}\n\nJPEG, PNG 형식의 이미지를 사용해주세요.`)
      } else if (errorMessage.includes('업로드 실패')) {
        alert(`❌ 이미지 업로드 실패\n\n${errorMessage}\n\n네트워크 연결을 확인하거나 잠시 후 다시 시도해주세요.`)
      } else {
        alert(`❌ 육안점검 데이터 저장에 실패했습니다.\n\n${errorMessage}`)
      }
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
                        value={form.location && !predefinedLocations.includes(form.location) ? '__CUSTOM__' : form.location}
                        onChange={(e) => {
                          if (e.target.value === '__CUSTOM__') {
                            updateFormItem(index, 'location', '__CUSTOM__')
                          } else {
                            updateFormItem(index, 'location', e.target.value)
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">선택</option>
                        {predefinedLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        <option value="__CUSTOM__">직접입력</option>
                      </select>
                      {(form.location === '__CUSTOM__' || (form.location && !predefinedLocations.includes(form.location))) && (
                        <input
                          type="text"
                          value={form.location === '__CUSTOM__' ? '' : form.location}
                          onChange={(e) => updateFormItem(index, 'location', e.target.value)}
                          placeholder="하자 위치를 직접 입력하세요"
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        하자 분류 <span className="text-red-500">*</span>
                      </label>
                      {form.location && !predefinedLocations.includes(form.location) && form.location !== '__CUSTOM__' ? (
                        <input
                          type="text"
                          value={form.classification}
                          onChange={(e) => updateFormItem(index, 'classification', e.target.value)}
                          placeholder="하자 분류를 직접 입력하세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                      ) : (
                        <>
                          <select
                            value={form.classification && form.location && form.location !== '__CUSTOM__' && locationClassifications[form.location]?.includes(form.classification) ? form.classification : (form.classification ? '__CUSTOM__' : '')}
                            onChange={(e) => {
                              if (e.target.value === '__CUSTOM__') {
                                updateFormItem(index, 'classification', '__CUSTOM__')
                              } else {
                                updateFormItem(index, 'classification', e.target.value)
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={!form.location || form.location === '__CUSTOM__'}
                          >
                            <option value="">
                              {form.location === '__CUSTOM__' ? '하자 위치를 먼저 입력하세요' : form.location ? '하자 분류를 선택하세요' : '하자 위치를 먼저 선택하세요'}
                            </option>
                            {form.location && form.location !== '__CUSTOM__' && locationClassifications[form.location]?.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                            {form.location && form.location !== '__CUSTOM__' && (
                              <option value="__CUSTOM__">직접입력</option>
                            )}
                          </select>
                          {(form.classification === '__CUSTOM__' || (form.classification && form.location && form.location !== '__CUSTOM__' && !locationClassifications[form.location]?.includes(form.classification))) && (
                            <input
                              type="text"
                              value={form.classification === '__CUSTOM__' ? '' : form.classification}
                              onChange={(e) => updateFormItem(index, 'classification', e.target.value)}
                              placeholder="하자 분류를 직접 입력하세요"
                              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      세부 내용 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={form.details}
                      onChange={(e) => updateFormItem(index, 'details', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 ${
                        form.details.trim().length > 0 && form.details.trim().length < 10
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="상세 설명 (10자 이상 입력해주세요)"
                    />
                    <div className="mt-1 flex justify-between items-center">
                      <span className={`text-xs ${
                        form.details.trim().length > 0 && form.details.trim().length < 10
                          ? 'text-red-500 font-medium'
                          : 'text-gray-500'
                      }`}>
                        {form.details.trim().length > 0 && form.details.trim().length < 10
                          ? '⚠️ 세부 내용은 10자 이상 입력해야 합니다.'
                          : `현재 ${form.details.trim().length}자`}
                      </span>
                      {form.details.trim().length >= 10 && (
                        <span className="text-xs text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 이미지 업로드 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {/* 근거리 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      근거리 사진 <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById(`multiple-image-upload-${index}`)?.click()}
                    >
                      {form.fullImage ? (
                        <div className="relative">
                          <img
                            src={form.fullImage instanceof File ? URL.createObjectURL(form.fullImage) : form.fullImage}
                            alt="근거리 사진"
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
                          <p className="text-xs text-gray-500">근거리 사진</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 원거리 사진 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      원거리 사진 <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById(`closeup-image-upload-${index}`)?.click()}
                    >
                      {form.closeupImage ? (
                        <div className="relative">
                          <img
                            src={form.closeupImage instanceof File ? URL.createObjectURL(form.closeupImage) : form.closeupImage}
                            alt="원거리 사진"
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
                          <p className="text-xs text-gray-500">원거리 사진</p>
                        </div>
                      )}
                    </div>
                  </div>

                 <span className="text-xs text-gray-500">- 근거리 사진 영역을 클릭하면 한 번에 사진 2장을 입력할 수 있습니다.</span>
                </div>

                {/* 이미지 업로드 버튼 - 각 영역별로 분리 */}
                <div className="text-center mt-4">
                  {/* 근거리 사진 클릭 시 2장 선택 (multiple) */}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        updateFormItemImages(index, Array.from(files))
                      }
                      e.target.value = '' // 같은 파일을 다시 선택할 수 있도록
                    }}
                    className="hidden"
                    id={`multiple-image-upload-${index}`}
                  />
                  
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files && files[0]) {
                        handleSingleImageUpload(index, 'closeupImage', files[0])
                      }
                      e.target.value = '' // 같은 파일을 다시 선택할 수 있도록
                    }}
                    className="hidden"
                    id={`closeup-image-upload-${index}`}
                  />
                </div>
              </div>
            ))}

            {/* 사진 추가 버튼 및 하자 정보 추가 버튼 */}
            <div className="text-center space-y-3">
              <div>
                <button
                  type="button"
                  onClick={handleAddPhotos}
                  className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  📷 하자 등록
                </button>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handlePhotosSelected}
                  className="hidden"
                  id="bulk-photo-upload"
                />
              </div>
            </div>

            {/* 안내 문구 */}
            <div className="text-sm text-gray-600 space-y-1 bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">📌 안내사항</p>
              <p>* "사진 추가" 버튼으로 여러 장을 선택하면 2개씩 묶어서 자동으로 하자 정보 항목이 추가됩니다.</p>
              <p>* 각 하자 정보 항목은 2장의 사진(근거리 사진, 원거리 사진)으로 구성됩니다.</p>
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



