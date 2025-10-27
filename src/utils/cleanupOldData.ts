import { supabase } from '../lib/supabase'

/**
 * 7일 이후 데이터를 자동으로 삭제합니다.
 * - 보고서 생성일이 7일이 지난 보고서의 이미지와 데이터를 삭제합니다.
 * - customer_reports 테이블의 고객 링크도 함께 삭제됩니다.
 */
export const cleanupOldData = async () => {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // 7일 이전에 생성된 보고서 조회
    const { data: oldReports, error: reportsError } = await supabase
      .from('reports_basic_info')
      .select('id, created_at')
      .lt('created_at', sevenDaysAgo.toISOString())

    if (reportsError) {
      console.error('Error fetching old reports:', reportsError)
      return
    }

    if (!oldReports || oldReports.length === 0) {
      console.log('No old reports to clean up')
      return
    }

    console.log(`Found ${oldReports.length} reports older than 7 days`)

    for (const report of oldReports) {
      // 관련 이미지 가져오기
      const { data: visualData } = await supabase
        .from('reports_visual')
        .select('image_path')
        .eq('report_id', report.id)

      if (visualData && visualData.length > 0) {
        // Storage에서 이미지 삭제
        const paths = visualData.map(img => img.image_path)
        const { error: storageError } = await supabase.storage
          .from('inspection-images')
          .remove(paths)

        if (storageError) {
          console.error(`Error deleting images for report ${report.id}:`, storageError)
        } else {
          console.log(`Deleted ${paths.length} images for report ${report.id}`)
        }
      }

      // 육안점검 데이터 삭제
      await supabase
        .from('reports_visual')
        .delete()
        .eq('report_id', report.id)

      // 장비점검 데이터 삭제
      await supabase
        .from('reports_equipment')
        .delete()
        .eq('report_id', report.id)

      // customer_reports 테이블의 고객 링크 삭제
      await supabase
        .from('customer_reports')
        .delete()
        .eq('report_id', report.id)

      // 기본 정보 삭제
      const { error: deleteError } = await supabase
        .from('reports_basic_info')
        .delete()
        .eq('id', report.id)

      if (deleteError) {
        console.error(`Error deleting report ${report.id}:`, deleteError)
      } else {
        console.log(`Deleted report ${report.id}`)
      }
    }

    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Error during cleanup:', error)
  }
}

/**
 * 백그라운드에서 자동 정리 작업을 시작합니다.
 * 페이지 로드 시 실행되며, 24시간마다 실행됩니다.
 */
export const startAutoCleanup = () => {
  // 즉시 한 번 실행
  cleanupOldData()

  // 24시간마다 실행
  setInterval(() => {
    cleanupOldData()
  }, 24 * 60 * 60 * 1000) // 24 hours
}
