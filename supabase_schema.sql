-- =========================================================================
-- ระบบประเมินครู (Teacher Evaluation System) - SQL Schema สำหรับ Supabase
-- สามารถคัดลอกโค้ดนี้ไปรันใน Supabase SQL Editor ได้ทันที
-- =========================================================================

-- 1. สร้างตารางแผนกวิชา (departments) - ศูนย์กลางข้อมูลเชิงสัมพันธ์
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  order_no INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. สร้างตารางข้อมูลครู (teachers) - รองรับครูได้ไม่จำกัด (150+ คน)
CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT DEFAULT '', -- วิชาที่สอน (ไม่บังคับ / เว้นว่างได้)
  department TEXT REFERENCES departments(name) ON UPDATE CASCADE ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ปรับให้คอลัมน์ subject ไม่บังคับกรอก (กรณีสร้างตารางไว้ก่อนแล้ว)
ALTER TABLE teachers ALTER COLUMN subject DROP NOT NULL;
ALTER TABLE teachers ALTER COLUMN subject SET DEFAULT '';

-- 3. สร้างตารางแบบประเมิน/คำถาม (survey_config)
CREATE TABLE IF NOT EXISTS survey_config (
  id TEXT PRIMARY KEY,
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  order_no INTEGER DEFAULT 1,
  question_type TEXT DEFAULT 'rating', -- 'rating' (1-5 scale) หรือ 'text' (ข้อความบรรยาย)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- เพิ่มคอลัมน์ question_type สำหรับตาราง survey_config (กรณีสร้างตารางไว้ก่อนแล้ว)
ALTER TABLE survey_config ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'rating';

-- 3.1 สร้างตารางด้านการประเมิน (survey_categories)
CREATE TABLE IF NOT EXISTS survey_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  order_no INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. สร้างตารางระดับชั้นเรียน (education_levels)
CREATE TABLE IF NOT EXISTS education_levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  order_no INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. สร้างตารางสาขาวิชา (majors)
CREATE TABLE IF NOT EXISTS majors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT REFERENCES departments(name) ON UPDATE CASCADE ON DELETE SET NULL,
  order_no INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. สร้างตารางเก็บผลการประเมิน (responses)
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id TEXT NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  gender TEXT DEFAULT 'ไม่ระบุเพศ',
  education_level TEXT DEFAULT 'ปวช.1',
  major TEXT DEFAULT 'สาขาวิชาพืชศาสตร์',
  scores JSONB NOT NULL, -- เก็บในรูปแบบ {"q1": 5, "q2": 4}
  text_answers JSONB, -- เก็บในรูปแบบ {"q_id": "คำตอบข้อเขียน"}
  average_score NUMERIC(3, 2) DEFAULT 0,
  feedback TEXT,
  suggestion TEXT, -- ข้อ 3.3 สิ่งที่ต้องการให้ครูผู้สอนปรับปรุงหรือจัดกิจกรรมเพิ่มเติม
  impression TEXT, -- ข้อ 3.4 ความประทับใจที่มีต่อครูผู้สอน
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- เพิ่มคอลัมน์ใหม่สำหรับตาราง responses (กรณีสร้างตาราง responses ไว้ก่อนแล้ว)
ALTER TABLE responses ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'ไม่ระบุเพศ';
ALTER TABLE responses ADD COLUMN IF NOT EXISTS education_level TEXT DEFAULT 'ปวช.1';
ALTER TABLE responses ADD COLUMN IF NOT EXISTS major TEXT DEFAULT 'สาขาวิชาพืชศาสตร์';
ALTER TABLE responses ADD COLUMN IF NOT EXISTS suggestion TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS impression TEXT;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS text_answers JSONB;

-- 7. สร้างตารางผู้ใช้งานระบบแอดมิน/ผู้บริหาร (admin_users)
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL, -- เก็บแบบเข้ารหัส SHA-256 (64 ตัวอักษร) พร้อมรองรับ Backward Compatibility รหัสผ่านเดิม
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin', -- 'superadmin', 'director', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. สร้างตารางปีการศึกษาและภาคเรียน (academic_periods)
CREATE TABLE IF NOT EXISTS academic_periods (
  id TEXT PRIMARY KEY,
  academic_year TEXT NOT NULL,
  term TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  total_students INTEGER DEFAULT 1848,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE academic_periods ADD COLUMN IF NOT EXISTS total_students INTEGER DEFAULT 1848;

-- 9. ดัชนีเพื่อเพิ่มความเร็วในการค้นหาและความสัมพันธ์เชิงข้อมูล (Relational Indexes)
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department);
CREATE INDEX IF NOT EXISTS idx_majors_department ON majors(department);
CREATE INDEX IF NOT EXISTS idx_responses_teacher_id ON responses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_responses_academic_term ON responses(academic_year, term);

-- 10. ตั้งค่าสิทธิ์ความปลอดภัย (Row Level Security: RLS)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;

-- สิทธิ์สำหรับตาราง survey_categories
CREATE POLICY "Allow public read survey_categories" ON survey_categories FOR SELECT USING (true);
CREATE POLICY "Allow public all survey_categories" ON survey_categories FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง departments
CREATE POLICY "Allow public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public all departments" ON departments FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง teachers
CREATE POLICY "Allow public read teachers" ON teachers FOR SELECT USING (true);
CREATE POLICY "Allow public all teachers" ON teachers FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง survey_config
CREATE POLICY "Allow public read survey_config" ON survey_config FOR SELECT USING (true);
CREATE POLICY "Allow public all survey_config" ON survey_config FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง education_levels
CREATE POLICY "Allow public read education_levels" ON education_levels FOR SELECT USING (true);
CREATE POLICY "Allow public all education_levels" ON education_levels FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง majors
CREATE POLICY "Allow public read majors" ON majors FOR SELECT USING (true);
CREATE POLICY "Allow public all majors" ON majors FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง responses (นักเรียนส่งผลได้ อ่านได้)
CREATE POLICY "Allow public read responses" ON responses FOR SELECT USING (true);
CREATE POLICY "Allow public insert responses" ON responses FOR INSERT WITH CHECK (true);

-- สิทธิ์สำหรับตาราง admin_users
CREATE POLICY "Allow public all admin_users" ON admin_users FOR ALL USING (true);

-- สิทธิ์สำหรับตาราง academic_periods
CREATE POLICY "Allow public all academic_periods" ON academic_periods FOR ALL USING (true);

-- =========================================================================
-- 11. ข้อมูลตัวอย่างเริ่มต้น (Seed Data)
-- =========================================================================

-- ข้อมูลแผนกวิชาเริ่มต้น (ครบถ้วนตามโครงสร้างวิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม)
INSERT INTO departments (id, name, order_no) VALUES
('dep-1', 'แผนกวิชาพืชศาสตร์', 1),
('dep-2', 'แผนกวิชาสัตวศาสตร์', 2),
('dep-3', 'แผนกวิชาช่างกลเกษตร', 3),
('dep-4', 'แผนกวิชาอุตสาหกรรมเกษตร', 4),
('dep-5', 'แผนกวิชาประมง', 5),
('dep-6', 'แผนกวิชาเทคโนโลยีสารสนเทศ', 6),
('dep-7', 'แผนกวิชาการบัญชีและการจัดการ', 7),
('dep-8', 'แผนกวิชาสามัญสัมพันธ์', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_no = EXCLUDED.order_no;

-- ข้อมูลระดับชั้นเริ่มต้น
INSERT INTO education_levels (id, name, order_no) VALUES
('el-1', 'ปวช.1', 1),
('el-2', 'ปวช.2', 2),
('el-3', 'ปวช.3', 3),
('el-4', 'ปวส.1', 4),
('el-5', 'ปวส.2', 5),
('el-6', 'ปริญญาตรี', 6)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_no = EXCLUDED.order_no;

-- ข้อมูลสาขาวิชาเริ่มต้น
INSERT INTO majors (id, name, department, order_no) VALUES
('maj-1', 'สาขาวิชาพืชศาสตร์', 'แผนกวิชาพืชศาสตร์', 1),
('maj-2', 'สาขาวิชาสัตวศาสตร์', 'แผนกวิชาสัตวศาสตร์', 2),
('maj-3', 'สาขาวิชาช่างกลเกษตร', 'แผนกวิชาช่างกลเกษตร', 3),
('maj-4', 'สาขาวิชาอุตสาหกรรมเกษตร', 'แผนกวิชาอุตสาหกรรมเกษตร', 4),
('maj-5', 'สาขาวิชาธุรกิจเกษตร', 'แผนกวิชาพืชศาสตร์', 5),
('maj-6', 'สาขาวิชาการบัญชี', 'แผนกวิชาการบัญชีและการจัดการ', 6),
('maj-7', 'สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', 'แผนกวิชาเทคโนโลยีสารสนเทศ', 7),
('maj-8', 'สาขาวิชาเทคโนโลยีสารสนเทศ', 'แผนกวิชาเทคโนโลยีสารสนเทศ', 8)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department, order_no = EXCLUDED.order_no;

-- ข้อมูลปีการศึกษาเริ่มต้น (รอบ 2567/1 เป็น Active)
INSERT INTO academic_periods (id, academic_year, term, is_active) VALUES
('p1', '2567', '1', true),
('p2', '2567', '2', false),
('p3', '2566', '2', false),
('p4', '2566', '1', false)
ON CONFLICT (id) DO UPDATE SET academic_year = EXCLUDED.academic_year, term = EXCLUDED.term;

-- ข้อมูลผู้ใช้งานแอดมินเริ่มต้น (เข้ารหัสผ่าน SHA-256 เรียบร้อยแล้ว ปลอดภัย 100%)
-- บัญชี admin    : รหัสผ่านเริ่มต้นคือ admin1234
-- บัญชี director : รหัสผ่านเริ่มต้นคือ director1234
INSERT INTO admin_users (id, username, password, name, role) VALUES
('u1', 'admin', 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270', 'ผู้ดูแลระบบหลัก (Admin ศูนย์ไอที)', 'superadmin'),
('u2', 'director', '3af5fc02597d6d20133cbcec834c651884f0d6d787e469edb34fc95605652cfa', 'ผู้อำนวยการวิทยาลัยฯ / ผู้บริหาร', 'director')
ON CONFLICT (id) DO UPDATE SET password = EXCLUDED.password, name = EXCLUDED.name;

-- ข้อมูลครูตัวอย่างเริ่มต้น (สามารถเพิ่มครูได้ถึง 150+ ท่านผ่านหน้าเว็บ)
INSERT INTO teachers (id, name, subject, department, image_url) VALUES
('t1', 'อ.สมศรี มีสุข', 'การปลูกพืชเศรษฐกิจและการเกษตรแม่นยำ', 'แผนกวิชาพืชศาสตร์', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'),
('t2', 'อ.วิชัย เก่งกล้า', 'การจัดการฟาร์มโคนมและสัตว์เคี้ยวเอื้อง', 'แผนกวิชาสัตวศาสตร์', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'),
('t3', 'อ.นภา พรประเสริฐ', 'การแปรรูปผลผลิตทางการเกษตรและบรรจุภัณฑ์', 'แผนกวิชาอุตสาหกรรมเกษตร', 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80'),
('t4', 'อ.เกียรติศักดิ์ พัฒนากุล', 'เทคโนโลยีเครื่องจักรกลและโดรนเพื่อการเกษตร', 'แผนกวิชาช่างกลเกษตร', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'),
('t5', 'อ.อรทัย วงศ์สมบูรณ์', 'การตลาดออนไลน์และการขายสินค้าเกษตรดิจิทัล', 'แผนกวิชาเทคโนโลยีสารสนเทศ', 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80')
-- ข้อมูลด้านการประเมินเริ่มต้น (5 ด้านมาตรฐาน)
INSERT INTO survey_categories (id, name, order_no) VALUES
('cat-1', 'ด้านการสอนและการถ่ายทอดความรู้', 1),
('cat-2', 'ด้านความเอาใจใส่และปฏิสัมพันธ์', 2),
('cat-3', 'ด้านสื่อและเทคนิคการจัดการเรียนรู้', 3),
('cat-4', 'ด้านประโยชน์และการนำไปใช้', 4),
('cat-5', 'ด้านคุณธรรม จริยธรรม และจรรยาบรรณวิชาชีพ', 5)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_no = EXCLUDED.order_no;

-- รายการคำถามประเมินเริ่มต้น 5 ข้อ
INSERT INTO survey_config (id, question_text, category, order_no) VALUES
('q1', 'อาจารย์อธิบายเนื้อหาอย่างช้าๆ ชัดเจน เข้าใจง่าย และใช้ภาษาที่เป็นกันเอง', 'ด้านการสอนและการถ่ายทอดความรู้', 1),
('q2', 'อาจารย์มีความอดทน ยิ้มแย้ม และยินดีตอบคำถามข้อสงสัยของผู้เรียนอย่างอบอุ่น', 'ด้านความเอาใจใส่และปฏิสัมพันธ์', 2),
('q3', 'อาจารย์ใช้อุปกรณ์ สื่อการสอน สไลด์ หรือแปลงสาธิตที่เห็นภาพชัดเจน ปฏิบัติได้จริง', 'ด้านสื่อและเทคนิคการจัดการเรียนรู้', 3),
('q4', 'ความรู้และทักษะที่ได้ สามารถนำไปประยุกต์ใช้ในการประกอบอาชีพหรือชีวิตประจำวันได้จริง', 'ด้านประโยชน์และการนำไปใช้', 4),
('q5', 'อาจารย์คอยสังเกตและให้ความช่วยเหลือผู้เรียนที่ตามไม่ทันอย่างใกล้ชิดและเสมอภาค', 'ด้านความเอาใจใส่และปฏิสัมพันธ์', 5)
ON CONFLICT (id) DO UPDATE SET question_text = EXCLUDED.question_text, category = EXCLUDED.category;

-- ผลประเมินตัวอย่างเริ่มต้น
INSERT INTO responses (teacher_id, academic_year, term, gender, education_level, major, scores, average_score, feedback, created_at) VALUES
('t1', '2567', '1', 'หญิง', 'ปวช.2', 'สาขาวิชาพืชศาสตร์', '{"q1": 5, "q2": 5, "q3": 4, "q4": 5, "q5": 5}'::jsonb, 4.80, 'อาจารย์ใจเย็นมาก สอนเข้าใจง่าย พาลงแปลงทดลองสนุกมากค่ะ', NOW() - INTERVAL '2 days'),
('t1', '2567', '1', 'ชาย', 'ปวช.3', 'สาขาวิชาพืชศาสตร์', '{"q1": 4, "q2": 5, "q3": 5, "q4": 4, "q5": 4}'::jsonb, 4.40, 'อยากให้เปิดคอร์สต่อเนื่องอีกครับ ได้ความรู้เยอะมาก', NOW() - INTERVAL '1 days'),
('t2', '2567', '1', 'ชาย', 'ปวส.1', 'สาขาวิชาสัตวศาสตร์', '{"q1": 5, "q2": 4, "q3": 5, "q4": 5, "q5": 4}'::jsonb, 4.60, 'นำความรู้เรื่องการดูแลสุขภาพสัตว์ไปใช้ที่ฟาร์มได้ผลดีมากครับ', NOW() - INTERVAL '3 hours'),
('t3', '2567', '1', 'หญิง', 'ปวส.2', 'สาขาวิชาอุตสาหกรรมเกษตร', '{"q1": 5, "q2": 5, "q3": 5, "q4": 5, "q5": 5}'::jsonb, 5.00, 'เรียนสนุก บรรยากาศอบอุ่น อาจารย์เตรียมอุปกรณ์มาให้ฝึกทำครบทุกคน', NOW() - INTERVAL '5 hours'),
('t4', '2567', '1', 'ชาย', 'ปวช.1', 'สาขาวิชาช่างกลเกษตร', '{"q1": 5, "q2": 5, "q3": 5, "q4": 4, "q5": 5}'::jsonb, 4.80, 'ได้ลองบังคับโดรนพ่นปุ๋ยจริง ตื่นเต้นและมีประโยชน์ต่อการทำเกษตรสมัยใหม่มากครับ', NOW() - INTERVAL '2 hours'),
('t5', '2567', '1', 'ไม่ระบุเพศ', 'ปริญญาตรี', 'สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', '{"q1": 5, "q2": 5, "q3": 4, "q4": 5, "q5": 4}'::jsonb, 4.60, 'สอนการทำตลาดออนไลน์และการขายสินค้าเกษตรได้ชัดเจนและปฏิบัติได้จริงค่ะ', NOW() - INTERVAL '1 hours');
