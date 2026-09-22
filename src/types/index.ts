export type UserRole = 'superadmin' | 'admin' | 'director';

export interface Teacher {
  id: string;
  name: string;
  subject?: string; // วิชาที่สอน (ไม่บังคับ / เว้นว่างได้)
  department?: string; // เช่น แผนกวิชาพืชศาสตร์, แผนกวิชาสัตวศาสตร์, แผนกวิชาช่างกลเกษตร
  image_url: string;
}

export type QuestionType = 'rating' | 'text';

export interface SurveyQuestion {
  id: string;
  question_text: string;
  category: string;
  order_no?: number;
  question_type?: QuestionType; // 'rating' (1-5 scale) หรือ 'text' (ข้อความบรรยาย/ปลายเปิด)
}

export interface SurveyCategory {
  id: string;
  name: string;
  order_no?: number;
}

export interface SurveyResponse {
  id?: string;
  teacher_id: string;
  teacher_name?: string;
  department?: string;
  academic_year: string;
  term: string;
  gender?: string; // 'ชาย' | 'หญิง' | 'ไม่ระบุเพศ'
  education_level?: string; // 'ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2', 'ปริญญาตรี'
  major?: string; // เช่น 'สาขาวิชาพืชศาสตร์', 'สาขาวิชาสัตวศาสตร์'
  scores: Record<string, number>; // { [question_id]: 1..5 }
  text_answers?: Record<string, string>; // { [question_id]: "ข้อความคำตอบ" }
  average_score?: number;
  feedback?: string;
  suggestion?: string; // ข้อ 3.3 สิ่งที่นักศึกษาต้องการให้ครูผู้สอนปรับปรุงหรือจัดกิจกรรมเพิ่มเติม
  impression?: string; // ข้อ 3.4 ความประทับใจที่มีต่อครูผู้สอน
  created_at?: string;
}

export interface EducationLevel {
  id: string;
  name: string; // เช่น 'ปวช.1', 'ปวช.2', 'ปวช.3', 'ปวส.1', 'ปวส.2', 'ปริญญาตรี'
  order_no?: number;
}

export interface Department {
  id: string;
  name: string; // เช่น 'แผนกวิชาพืชศาสตร์', 'แผนกวิชาสัตวศาสตร์'
  order_no?: number;
}

export interface Major {
  id: string;
  name: string; // เช่น 'สาขาวิชาพืชศาสตร์', 'สาขาวิชาสัตวศาสตร์'
  department?: string;
  order_no?: number;
}

export interface CategoryScoreSummary {
  category: string;
  score: number;
  count: number;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: UserRole; // 'director' = ดู Dashboard ได้อย่างเดียว, 'superadmin' / 'admin' = จัดการได้ทั้งหมด
  created_at?: string;
}

export interface AcademicPeriod {
  id: string;
  academic_year: string; // เช่น '2567', '2568'
  term: string; // เช่น '1', '2', 'ฤดูร้อน'
  is_active: boolean; // เป็นปีการศึกษา/ภาคเรียนที่ระบบเปิดให้ประเมิน ณ ปัจจุบันหรือไม่
  total_students?: number; // จำนวนผู้เรียนทั้งหมดตามทะเบียน (เช่น 1,848 คน)
  created_at?: string;
}

