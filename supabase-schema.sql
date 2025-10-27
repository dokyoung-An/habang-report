-- ============================================
-- 하방 점검 보고서 데이터베이스 스키마
-- ============================================

-- 1. 기본 정보 테이블
CREATE TABLE reports_basic_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  apt_name TEXT NOT NULL,
  dong TEXT NOT NULL,
  ho TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  contact TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID
);

-- 2. 장비점검 테이블
CREATE TABLE reports_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports_basic_info(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  is_checked BOOLEAN DEFAULT FALSE,
  input_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 육안점검 테이블
CREATE TABLE reports_visual (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES reports_basic_info(id) ON DELETE CASCADE,
  space_item TEXT,
  title TEXT,
  content TEXT,
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL, -- 'full', 'closeup', 'angle'
  location TEXT,
  classification TEXT,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX idx_reports_equipment_report_id ON reports_equipment(report_id);
CREATE INDEX idx_reports_visual_report_id ON reports_visual(report_id);
CREATE INDEX idx_reports_basic_info_created_at ON reports_basic_info(created_at DESC);

-- ============================================
-- RLS (Row Level Security) 정책 설정
-- ============================================

-- RLS 활성화
ALTER TABLE reports_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports_visual ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (Public Read)
CREATE POLICY "Enable read access for all users" ON reports_basic_info
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON reports_equipment
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON reports_visual
  FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능 (Public Insert)
CREATE POLICY "Enable insert access for all users" ON reports_basic_info
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert access for all users" ON reports_equipment
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert access for all users" ON reports_visual
  FOR INSERT WITH CHECK (true);

-- 모든 사용자가 삭제 가능 (Public Delete)
CREATE POLICY "Enable delete access for all users" ON reports_basic_info
  FOR DELETE USING (true);

CREATE POLICY "Enable delete access for all users" ON reports_equipment
  FOR DELETE USING (true);

CREATE POLICY "Enable delete access for all users" ON reports_visual
  FOR DELETE USING (true);

-- ============================================
-- 기존 테이블에 컬럼 추가 (이미 테이블이 생성된 경우)
-- ============================================

-- customer_name 컬럼 추가 (이미 존재하는 경우 무시)
ALTER TABLE reports_basic_info 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- reports_visual 테이블에 새 컬럼들 추가
ALTER TABLE reports_visual 
ADD COLUMN IF NOT EXISTS space_item TEXT;

ALTER TABLE reports_visual 
ADD COLUMN IF NOT EXISTS title TEXT;

ALTER TABLE reports_visual 
ADD COLUMN IF NOT EXISTS content TEXT;

ALTER TABLE reports_visual 
ADD COLUMN IF NOT EXISTS image_type TEXT;

-- 기존 location, classification, details 컬럼을 nullable로 변경
ALTER TABLE reports_visual 
ALTER COLUMN location DROP NOT NULL;

ALTER TABLE reports_visual 
ALTER COLUMN classification DROP NOT NULL;

ALTER TABLE reports_visual 
ALTER COLUMN details DROP NOT NULL;

-- ============================================
-- 참고사항
-- ============================================

-- Storage Bucket 생성 (Supabase Dashboard에서 수동으로 생성 필요)
-- 1. Supabase Dashboard → Storage → Create Bucket
-- 2. Bucket 이름: inspection-images
-- 3. Public bucket: ✅ 체크
-- 4. File size limit: 50MB
-- 5. Allowed MIME types: image/*

-- Storage Policy 설정 (SQL Editor에서 실행)
-- INSERT POLICY for bucket
-- CREATE POLICY "Enable upload for all users"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'inspection-images');

-- SELECT POLICY for bucket
-- CREATE POLICY "Enable read for all users"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'inspection-images');

-- DELETE POLICY for bucket
-- CREATE POLICY "Enable delete for all users"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'inspection-images');

-- ============================================
-- 사용자 인증 및 권한 관리
-- ============================================

-- 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'pending', -- 'admin', 'approved', 'pending'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- RLS 정책 설정
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 자신의 프로필을 읽을 수 있음
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- 관리자는 모든 프로필을 볼 수 있음
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 사용자는 자신의 프로필만 수정할 수 있음 (이름만)
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 관리자는 사용자 승인 상태를 변경할 수 있음
CREATE POLICY "Admins can update user approvals" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 새로운 사용자 등록 시 자동으로 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 초기 관리자 설정 함수 (수동으로 실행 필요)
CREATE OR REPLACE FUNCTION public.set_initial_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.user_profiles
  SET role = 'admin'
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 기존 테이블에 user_id 연결
-- ============================================

-- reports_basic_info 테이블에 user_id 외래 키 추가
ALTER TABLE reports_basic_info
ADD CONSTRAINT fk_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- RLS 정책 업데이트: 인증된 사용자만 자신의 보고서를 관리할 수 있음
DROP POLICY IF EXISTS "Enable insert access for all users" ON reports_basic_info;
DROP POLICY IF EXISTS "Enable delete access for all users" ON reports_basic_info;

CREATE POLICY "Approved users can create reports" ON reports_basic_info
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'approved')
    )
  );

CREATE POLICY "Users can manage their own reports" ON reports_basic_info
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own reports" ON reports_basic_info
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 참고사항
-- ============================================

-- 최초 관리자 설정 방법:
-- 1. 회원가입 후 이메일 확인
-- 2. Supabase SQL Editor에서 다음 명령 실행:
--    SELECT public.set_initial_admin('your-email@example.com');

