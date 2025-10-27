# 하방 점검 보고서 웹앱

아파트/시설물 점검 보고서를 자동으로 생성하고 PDF로 다운로드하는 반응형 웹 애플리케이션입니다.

## 🚀 기술 스택

- **프론트엔드**: React 18 + TypeScript + Vite
- **백엔드/DB**: Supabase (PostgreSQL, Authentication, Storage)
- **스타일링**: Tailwind CSS
- **PDF 생성**: jsPDF
- **이미지 처리**: Pica (클라이언트 측 압축)
- **PWA**: vite-plugin-pwa

## 📋 주요 기능

1. **기본 정보 입력** - 아파트명, 동/호수, 연락처
2. **장비점검 보고서** - 체크리스트 기반 장비 상태 점검
3. **육안점검 보고서** - 사진 업로드 및 하자 내역 작성
   - 다중 이미지 업로드 (2장당 1개 폼 자동 생성)
   - 클라이언트 측 이미지 자동 압축
4. **최종 보고서 생성** - PDF 다운로드
5. **사진 일괄 다운로드** - 워터마크(하얀색, 투명도 40%) 적용
6. **보고서 관리** - 저장된 보고서 조회 및 삭제
7. **PWA 지원** - 모바일에서 앱처럼 설치 가능

## 🛠️ 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 3. Supabase 데이터베이스 설정

Supabase 프로젝트에서 다음 SQL을 실행하여 테이블을 생성하세요:

\`\`\`sql
-- 기본 정보 테이블
CREATE TABLE reports_basic_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apt_name TEXT NOT NULL,
  dong TEXT NOT NULL,
  ho TEXT NOT NULL,
  contact TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- 장비점검 테이블
CREATE TABLE reports_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports_basic_info(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  input_text TEXT
);

-- 육안점검 테이블
CREATE TABLE reports_visual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports_basic_info(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  location TEXT NOT NULL,
  classification TEXT NOT NULL,
  details TEXT NOT NULL
);

-- Storage Bucket 생성 (Supabase Dashboard에서 수동으로 생성)
-- Bucket 이름: inspection-images
-- Public access: true
\`\`\`

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 `http://localhost:5173` 접속

### 5. 프로덕션 빌드

\`\`\`bash
npm run build
npm run preview
\`\`\`

## 📱 페이지 구조

- `/` - 홈페이지 (보고서 작성 시작)
- `/basic-info` - 기본 정보 입력
- `/select-report-type` - 보고서 유형 선택
- `/equipment-check` - 장비점검 보고서 작성
- `/visual-check` - 육안점검 보고서 작성
- `/final-report` - 최종 보고서 확인 및 다운로드
- `/manage-reports` - 보고서 관리 (조회/삭제)

## 🔐 Supabase Storage 설정

1. Supabase Dashboard → Storage → Create Bucket
2. Bucket 이름: `inspection-images`
3. Public bucket: ✅ 체크
4. File size limit: 50MB
5. Allowed MIME types: `image/*`

## 🗑️ 이미지 자동 삭제 (1달 후)

Supabase Edge Function 또는 Cron Job을 사용하여 구현할 수 있습니다:

### 방법 1: Supabase Edge Function

\`\`\`typescript
// supabase/functions/delete-old-images/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1달 전 날짜
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  // 오래된 이미지 조회
  const { data: oldImages } = await supabase
    .from('reports_visual')
    .select('image_path, created_at')
    .lt('created_at', oneMonthAgo.toISOString())

  // 이미지 삭제
  if (oldImages) {
    const paths = oldImages.map(img => img.image_path)
    await supabase.storage.from('inspection-images').remove(paths)
    await supabase.from('reports_visual').delete().lt('created_at', oneMonthAgo.toISOString())
  }

  return new Response(JSON.stringify({ deleted: oldImages?.length ?? 0 }))
})
\`\`\`

### 방법 2: GitHub Actions Cron Job

\`\`\`.github/workflows/cleanup.yml
name: Delete Old Images
on:
  schedule:
    - cron: '0 0 * * *' # 매일 자정

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Supabase Function
        run: |
          curl -X POST https://your-project.supabase.co/functions/v1/delete-old-images \\
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
\`\`\`

## 📝 TODO

- [ ] Supabase Authentication 연동 (로그인 기능)
- [ ] 보고서 수정 기능
- [ ] 더 다양한 하자 분류 옵션
- [ ] 다크 모드 지원
- [ ] 이미지 자동 삭제 기능 구현

## 📄 라이선스

MIT License

