# Supabase 설정 가이드

## 1단계: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Name: `habang-report` (원하는 이름)
   - Database Password: 강력한 비밀번호 설정
   - Region: `Northeast Asia (Seoul)` 선택 (한국 사용자용)
4. "Create new project" 클릭

## 2단계: 데이터베이스 테이블 생성

1. Supabase Dashboard에서 **SQL Editor** 클릭
2. "New query" 클릭
3. `supabase-schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 실행

### 확인 방법:
- 좌측 메뉴 **Table Editor** 클릭
- 다음 3개의 테이블이 생성되었는지 확인:
  - `reports_basic_info`
  - `reports_equipment`
  - `reports_visual`

## 3단계: Storage Bucket 생성

1. 좌측 메뉴에서 **Storage** 클릭
2. "Create a new bucket" 클릭
3. 설정:
   - Name: `inspection-images`
   - ✅ Public bucket (체크)
   - File size limit: `50 MB`
   - Allowed MIME types: `image/*`
4. "Create bucket" 클릭

### Storage Policy 설정:

Storage 버킷을 생성한 후, SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- INSERT POLICY
CREATE POLICY "Enable upload for all users"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inspection-images');

-- SELECT POLICY
CREATE POLICY "Enable read for all users"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspection-images');

-- DELETE POLICY
CREATE POLICY "Enable delete for all users"
ON storage.objects FOR DELETE
USING (bucket_id = 'inspection-images');
```

## 4단계: API Keys 가져오기

1. 좌측 메뉴에서 **Settings** → **API** 클릭
2. 다음 정보를 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 5단계: 환경 변수 설정

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 입력:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **주의**: 위의 값들을 실제 Supabase 프로젝트의 값으로 교체하세요!

## 6단계: 개발 서버 재시작

환경 변수를 추가했다면 개발 서버를 재시작하세요:

```bash
# Ctrl + C로 서버 중지 (백그라운드라면 그냥 진행)
npm run dev
```

## 7단계: 테스트

1. 브라우저에서 `http://localhost:5173` 접속
2. "보고서 작성하기" 클릭
3. 기본 정보 입력 후 제출
4. Supabase Dashboard → Table Editor → `reports_basic_info`에서 데이터가 저장되었는지 확인

## 선택사항: 이미지 자동 삭제 (1달 후)

### Supabase Edge Function 생성

1. Supabase CLI 설치:
```bash
npm install -g supabase
```

2. Supabase 로그인:
```bash
supabase login
```

3. Edge Function 생성:
```bash
supabase functions new delete-old-images
```

4. `supabase/functions/delete-old-images/index.ts` 파일에 다음 코드 작성:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1달 전 날짜
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  try {
    // 오래된 이미지 조회
    const { data: oldImages } = await supabaseClient
      .from('reports_visual')
      .select('image_path')
      .lt('created_at', oneMonthAgo.toISOString())

    if (oldImages && oldImages.length > 0) {
      // Storage에서 이미지 삭제
      const paths = oldImages.map(img => img.image_path)
      await supabaseClient.storage
        .from('inspection-images')
        .remove(paths)

      // DB에서 레코드 삭제
      await supabaseClient
        .from('reports_visual')
        .delete()
        .lt('created_at', oneMonthAgo.toISOString())

      return new Response(
        JSON.stringify({ 
          success: true, 
          deleted: oldImages.length 
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: 0 
      }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" } 
      }
    )
  }
})
```

5. Deploy:
```bash
supabase functions deploy delete-old-images
```

6. Cron Job 설정 (Supabase Dashboard):
   - Database → Cron Jobs
   - 매일 실행되도록 설정

## 문제 해결

### 문제: "Failed to fetch" 에러
**해결**: `.env` 파일의 Supabase URL과 Key가 올바른지 확인하세요.

### 문제: 이미지 업로드 실패
**해결**: Storage Policy가 올바르게 설정되었는지 확인하세요.

### 문제: CORS 에러
**해결**: Supabase Dashboard → Settings → API → CORS에 `http://localhost:5173` 추가

## 완료! 🎉

모든 설정이 완료되었습니다. 이제 웹앱을 사용할 수 있습니다!



