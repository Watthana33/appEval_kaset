import { supabase } from '../supabaseClient.js';
import { isSupabaseConfigured } from '../config.js';
import { 
  Teacher, 
  SurveyQuestion, 
  SurveyResponse, 
  AdminUser, 
  AcademicPeriod,
  EducationLevel,
  Major,
  Department,
  SurveyCategory
} from '../types/index';

// ข้อมูลจำลองเริ่มต้นของ วิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม
const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 't1',
    name: 'อ.สมศรี มีสุข',
    subject: 'การปลูกพืชเศรษฐกิจและการเกษตรแม่นยำ',
    department: 'แผนกวิชาพืชศาสตร์',
    image_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't2',
    name: 'อ.วิชัย เก่งกล้า',
    subject: 'การจัดการฟาร์มโคนมและสัตว์เคี้ยวเอื้อง',
    department: 'แผนกวิชาสัตวศาสตร์',
    image_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't3',
    name: 'อ.นภา พรประเสริฐ',
    subject: 'การแปรรูปผลผลิตทางการเกษตรและบรรจุภัณฑ์',
    department: 'แผนกวิชาอุตสาหกรรมเกษตร',
    image_url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't4',
    name: 'อ.เกียรติศักดิ์ พัฒนากุล',
    subject: 'เทคโนโลยีเครื่องจักรกลและโดรนเพื่อการเกษตร',
    department: 'แผนกวิชาช่างกลเกษตร',
    image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 't5',
    name: 'อ.อรทัย วงศ์สมบูรณ์',
    subject: 'การตลาดออนไลน์และการขายสินค้าเกษตรดิจิทัล',
    department: 'แผนกวิชาเทคโนโลยีสารสนเทศ',
    image_url: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'u1',
    username: 'admin',
    // SHA-256 hash ของ 'admin1234'
    password: 'ac9689e2272427085e35b9d3e3e8bed88cb3434828b43b86fc0596cad4c6e270',
    name: 'ผู้ดูแลระบบหลัก (Admin ศูนย์ไอที)',
    role: 'superadmin',
  },
  {
    id: 'u2',
    username: 'director',
    // SHA-256 hash ของ 'director1234'
    password: '3af5fc02597d6d20133cbcec834c651884f0d6d787e469edb34fc95605652cfa',
    name: 'ผู้อำนวยการวิทยาลัยฯ / ผู้บริหาร',
    role: 'director',
  },
];

// 3 มิติหลักตามมาตรฐานรายงานวิทยาลัยเกษตรและเทคโนโลยีมหาสารคาม (Looker Studio Standard)
export type DimensionKey = 'ด้านผู้สอน' | 'ด้านกิจกรรม' | 'ด้านความพึงพอใจ';

export const getQuestionDimension = (category?: string): DimensionKey => {
  if (!category) return 'ด้านผู้สอน';
  const cat = category.trim();

  // 1. ตรวจสอบความพึงพอใจก่อน (เพราะชื่อเต็มมักมีคำว่า 'ผู้สอน' หรือ 'การสอน' พ่วงอยู่ด้วย)
  if (
    cat.includes('ความพึงพอใจ') ||
    cat.includes('ประโยชน์') ||
    cat.includes('นำไปใช้') ||
    cat.includes('คุณธรรม')
  ) {
    return 'ด้านความพึงพอใจ';
  }

  // 2. ตรวจสอบด้านการจัดกิจกรรมการเรียนการสอนและการประเมินผล
  if (
    cat.includes('กิจกรรม') ||
    cat.includes('การจัดกิจกรรม') ||
    cat.includes('ประเมินผล') ||
    cat.includes('สื่อ') ||
    cat.includes('เทคนิค') ||
    cat.includes('ปฏิบัติ')
  ) {
    return 'ด้านกิจกรรม';
  }

  // 3. ด้านผู้สอน
  return 'ด้านผู้สอน';
};

const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1',
    question_text: 'อาจารย์อธิบายเนื้อหาอย่างช้าๆ ชัดเจน เข้าใจง่าย และใช้ภาษาที่เป็นกันเอง',
    category: 'ด้านผู้สอน',
    order_no: 1,
  },
  {
    id: 'q2',
    question_text: 'อาจารย์มีความอดทน ยิ้มแย้ม และยินดีตอบคำถามข้อสงสัยของผู้เรียนอย่างอบอุ่น',
    category: 'ด้านผู้สอน',
    order_no: 2,
  },
  {
    id: 'q3',
    question_text: 'อาจารย์ใช้อุปกรณ์ สื่อการสอน สไลด์ หรือแปลงสาธิตที่เห็นภาพชัดเจน ปฏิบัติได้จริง',
    category: 'ด้านกิจกรรม',
    order_no: 3,
  },
  {
    id: 'q4',
    question_text: 'อาจารย์จัดกิจกรรมการเรียนรู้ที่เปิดโอกาสให้ผู้เรียนได้ฝึกปฏิบัติจริงและมีส่วนร่วม',
    category: 'ด้านกิจกรรม',
    order_no: 4,
  },
  {
    id: 'q5',
    question_text: 'ความรู้และทักษะที่ได้ สามารถนำไปประยุกต์ใช้ในการประกอบอาชีพหรือชีวิตประจำวันได้จริง',
    category: 'ด้านความพึงพอใจ',
    order_no: 5,
  },
];

const DEFAULT_RESPONSES: SurveyResponse[] = [
  {
    id: 'res-1',
    teacher_id: 't1',
    teacher_name: 'อ.สมศรี มีสุข',
    department: 'แผนกวิชาพืชศาสตร์',
    academic_year: '2567',
    term: '1',
    gender: 'หญิง',
    education_level: 'ปวช.2',
    major: 'สาขาวิชาพืชศาสตร์',
    scores: { q1: 5, q2: 5, q3: 5, q4: 4, q5: 5 },
    average_score: 4.8,
    suggestion: 'อยากให้พาลงแปลงทดลองสัปดาห์ละ 2 ครั้งเพื่อดูการเจริญเติบโตของพืชต่อเนื่องค่ะ',
    impression: 'อาจารย์ใจเย็นมาก สอนเข้าใจง่าย บรรยากาศการเรียนเป็นกันเองและอบอุ่นมากค่ะ',
    feedback: 'อาจารย์ใจเย็นมาก สอนเข้าใจง่าย พาลงแปลงทดลองสนุกมากค่ะ',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'res-2',
    teacher_id: 't1',
    teacher_name: 'อ.สมศรี มีสุข',
    department: 'แผนกวิชาพืชศาสตร์',
    academic_year: '2567',
    term: '1',
    gender: 'ชาย',
    education_level: 'ปวช.3',
    major: 'สาขาวิชาพืชศาสตร์',
    scores: { q1: 5, q2: 4, q3: 4, q4: 5, q5: 5 },
    average_score: 4.6,
    suggestion: 'อยากให้เปิดหลักสูตรการปลูกพืชไร้ดินเพิ่มเติมในภาคเรียนหน้าครับ',
    impression: 'อาจารย์อธิบายเนื้อหาและสาธิตการผสมปุ๋ยได้เข้าใจง่ายมากครับ',
    feedback: 'อยากให้เปิดคอร์สต่อเนื่องอีกครับ ได้ความรู้เยอะมาก',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'res-3',
    teacher_id: 't2',
    teacher_name: 'อ.วิชัย เก่งกล้า',
    department: 'แผนกวิชาสัตวศาสตร์',
    academic_year: '2567',
    term: '1',
    gender: 'ชาย',
    education_level: 'ปวส.1',
    major: 'สาขาวิชาสัตวศาสตร์',
    scores: { q1: 5, q2: 5, q3: 4, q4: 5, q5: 5 },
    average_score: 4.8,
    suggestion: 'อยากให้มีคลิปสรุปขั้นตอนการตรวจสุขภาพสัตว์ย้อนหลังเพื่อทบทวนครับ',
    impression: 'อาจารย์มีความเชี่ยวชาญสูง ให้คำแนะนำการจัดการฟาร์มที่นำไปใช้ได้จริง',
    feedback: 'นำความรู้เรื่องการดูแลสุขภาพสัตว์ไปใช้ที่ฟาร์มได้ผลดีมากครับ',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 'res-4',
    teacher_id: 't3',
    teacher_name: 'อ.นภา พรประเสริฐ',
    department: 'แผนกวิชาอุตสาหกรรมเกษตร',
    academic_year: '2567',
    term: '1',
    gender: 'หญิง',
    education_level: 'ปวส.2',
    major: 'สาขาวิชาอุตสาหกรรมเกษตร',
    scores: { q1: 5, q2: 5, q3: 5, q4: 5, q5: 5 },
    average_score: 5.0,
    suggestion: 'อยากให้อุปกรณ์ห้องปฏิบัติการแปรรูปมีจำนวนเพิ่มขึ้นเพื่อความสะดวกรวดเร็วค่ะ',
    impression: 'อาจารย์เตรียมวัตถุดิบและอุปกรณ์มาให้ฝึกทำครบทุกคน บรรยากาศอบอุ่นมาก',
    feedback: 'เรียนสนุก บรรยากาศอบอุ่น อาจารย์เตรียมอุปกรณ์มาให้ฝึกทำครบทุกคน',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'res-5',
    teacher_id: 't4',
    teacher_name: 'อ.เกียรติศักดิ์ พัฒนากุล',
    department: 'แผนกวิชาช่างกลเกษตร',
    academic_year: '2567',
    term: '1',
    gender: 'ชาย',
    education_level: 'ปวช.1',
    major: 'สาขาวิชาช่างกลเกษตร',
    scores: { q1: 5, q2: 4, q3: 5, q4: 5, q5: 4 },
    average_score: 4.6,
    suggestion: 'อยากให้เพิ่มชั่วโมงฝึกบินโดรนเพื่อการเกษตรในแปลงจริงครับ',
    impression: 'อาจารย์สอนระบบกลไกเครื่องจักรและระบบความปลอดภัยได้อย่างเป็นมืออาชีพ',
    feedback: 'ได้ลองบังคับโดรนพ่นปุ๋ยจริง ตื่นเต้นและมีประโยชน์ต่อการทำเกษตรสมัยใหม่มากครับ',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'res-6',
    teacher_id: 't5',
    teacher_name: 'อ.อรทัย วงศ์สมบูรณ์',
    department: 'แผนกวิชาเทคโนโลยีสารสนเทศ',
    academic_year: '2567',
    term: '1',
    gender: 'ไม่ระบุเพศ',
    education_level: 'ปริญญาตรี',
    major: 'สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล',
    scores: { q1: 5, q2: 5, q3: 4, q4: 4, q5: 5 },
    average_score: 4.6,
    suggestion: 'อยากให้มีกรณีศึกษาการทำ Live Commerce ขายผลผลิตการเกษตรเพิ่มเติมค่ะ',
    impression: 'อาจารย์ทันสมัย ยกตัวอย่างธุรกิจดิจิทัลที่มองเห็นภาพและทำตามได้จริง',
    feedback: 'สอนการทำตลาดออนไลน์และการขายสินค้าเกษตรได้ชัดเจนและปฏิบัติได้จริงค่ะ',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'res-7',
    teacher_id: 't1',
    teacher_name: 'อ.สมศรี มีสุข',
    department: 'แผนกวิชาพืชศาสตร์',
    academic_year: '2567',
    term: '1',
    gender: 'หญิง',
    education_level: 'ปวช.2',
    major: 'สาขาวิชาธุรกิจเกษตร',
    scores: { q1: 5, q2: 5, q3: 5, q4: 5, q5: 5 },
    average_score: 5.0,
    suggestion: 'อยากให้มีการจัดศึกษาดูงานสวนเกษตรอัจฉริยะนอกสถานที่ค่ะ',
    impression: 'อาจารย์ตอบคำถามอย่างละเอียด เป็นที่ปรึกษาโครงงานที่ดีเยี่ยมค่ะ',
    feedback: 'อาจารย์เป็นที่ปรึกษาที่ดีมาก ดูแลเอาใจใส่ทุกคน',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: 'res-8',
    teacher_id: 't2',
    teacher_name: 'อ.วิชัย เก่งกล้า',
    department: 'แผนกวิชาสัตวศาสตร์',
    academic_year: '2567',
    term: '1',
    gender: 'ชาย',
    education_level: 'ปวส.2',
    major: 'สาขาวิชาสัตวศาสตร์',
    scores: { q1: 4, q2: 5, q3: 4, q4: 5, q5: 5 },
    average_score: 4.6,
    suggestion: 'อยากให้มีตัวอย่างการผสมอาหารสัตว์ต้นทุนต่ำเพิ่มเติมครับ',
    impression: 'อาจารย์สอนเทคนิคจากประสบการณ์จริงในฟาร์ม มีประโยชน์มาก',
    feedback: 'อาจารย์มีประสบการณ์สูง สอนเทคนิคการจัดการฟาร์มที่ใช้ได้จริง',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

// Helper จัดการ LocalStorage สำหรับกรณี Offline/Mock
const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(`eval_mcat_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(`eval_mcat_${key}`, JSON.stringify(data));
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
};

// ==========================================
// 1. จัดการข้อมูลครู (Teachers - รองรับ 150+ ท่าน)
// ==========================================

/**
 * แปลงลิงก์รูปภาพ (โดยเฉพาะลิงก์แชร์จาก Google Drive ให้เป็น Direct Image Link ที่แสดงผลบนเว็บได้ 100%)
 */
export const formatGoogleDriveUrl = (url?: string): string => {
  if (!url || !url.trim()) return '';
  const trimmed = url.trim();

  // 1. รูปแบบ Google Drive: https://drive.google.com/file/d/FILE_ID/view...
  const matchFile = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFile && matchFile[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFile[1]}`;
  }

  // 2. รูปแบบ Google Drive: https://drive.google.com/open?id=FILE_ID หรือ uc?id=FILE_ID
  const matchId = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (matchId && matchId[1]) {
    return `https://lh3.googleusercontent.com/d/${matchId[1]}`;
  }

  // 3. รูปแบบ Google Drive: https://drive.google.com/thumbnail?id=FILE_ID
  const matchThumb = trimmed.match(/drive\.google\.com\/thumbnail\?(?:.*&)?id=([a-zA-Z0-9_-]+)/i);
  if (matchThumb && matchThumb[1]) {
    return `https://lh3.googleusercontent.com/d/${matchThumb[1]}`;
  }

  return trimmed;
};

export const getTeachers = async (): Promise<Teacher[]> => {
  let teachers: Teacher[] = [];
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('teachers').select('*').order('name');
      if (error) throw error;
      if (data && data.length > 0) teachers = data;
    } catch (err) {
      console.warn('Supabase getTeachers fallback to local data:', err);
    }
  }
  if (teachers.length === 0) {
    teachers = getLocalData<Teacher[]>('teachers', DEFAULT_TEACHERS);
  }

  // ซ่อมแซมและแปลงลิงก์ Google Drive อัตโนมัติ (Auto-repair Google Drive Links)
  return teachers.map((t) => ({
    ...t,
    image_url: formatGoogleDriveUrl(t.image_url) || t.image_url,
  }));
};

export const getTeacherById = async (id: string): Promise<Teacher | null> => {
  const teachers = await getTeachers();
  return teachers.find((t) => t.id === id) || null;
};

export const addTeacher = async (teacher: Omit<Teacher, 'id'> & { id?: string }): Promise<Teacher> => {
  const formattedImg = formatGoogleDriveUrl(teacher.image_url) || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80';
  const cleanDept = teacher.department?.trim() || '';
  const newTeacher: Teacher = {
    ...teacher,
    id: teacher.id || `t_${Date.now()}`,
    department: cleanDept,
    image_url: formattedImg,
  };

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        ...newTeacher,
        department: cleanDept || null, // ส่ง null หากไม่ระบุแผนก เพื่อให้สอดคล้องกับ foreign key ใน Supabase
      };
      const { data, error } = await supabase
        .from('teachers')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;
      if (data) return { ...data, department: data.department || '' };
    } catch (err) {
      console.warn('Supabase addTeacher fallback:', err);
    }
  }

  const current = getLocalData<Teacher[]>('teachers', DEFAULT_TEACHERS);
  const updated = [...current, newTeacher];
  setLocalData('teachers', updated);
  return newTeacher;
};

export const updateTeacher = async (id: string, updates: Partial<Teacher>): Promise<Teacher | null> => {
  const processedUpdates: Partial<Teacher> = { ...updates };
  if (processedUpdates.image_url) {
    processedUpdates.image_url = formatGoogleDriveUrl(processedUpdates.image_url);
  }
  if (processedUpdates.department !== undefined) {
    processedUpdates.department = processedUpdates.department?.trim() || '';
  }

  if (isSupabaseConfigured()) {
    try {
      const payload = {
        ...processedUpdates,
        department: processedUpdates.department ? processedUpdates.department : null,
      };
      const { data, error } = await supabase
        .from('teachers')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data) return { ...data, department: data.department || '' };
    } catch (err) {
      console.warn('Supabase updateTeacher fallback:', err);
    }
  }

  const current = getLocalData<Teacher[]>('teachers', DEFAULT_TEACHERS);
  const index = current.findIndex((t) => t.id === id);
  if (index !== -1) {
    const updated = { ...current[index], ...processedUpdates };
    current[index] = updated;
    setLocalData('teachers', current);
    return updated;
  }
  return null;
};

export const deleteTeacher = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase deleteTeacher fallback:', err);
    }
  }

  const current = getLocalData<Teacher[]>('teachers', DEFAULT_TEACHERS);
  const updated = current.filter((t) => t.id !== id);
  setLocalData('teachers', updated);
  return true;
};

// ==========================================
// ==========================================
// 2. จัดการผู้ใช้งานแอดมิน (Admin Users Management)
// ==========================================

/**
 * ฟังก์ชันเข้ารหัสผ่านด้วยมาตรฐานสากล SHA-256 ผ่าน Web Crypto API
 */
export const hashPassword = async (password: string): Promise<string> => {
  if (!password) return '';
  try {
    const msgUint8 = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.warn('Web Crypto API hash failed:', err);
    return password;
  }
};

/**
 * ตรวจสอบว่ารหัสผ่านถูกเข้ารหัสด้วย SHA-256 (64 hex characters) แล้วหรือไม่
 */
export const isPasswordHashed = (password?: string): boolean => {
  if (!password) return false;
  return /^[a-f0-9]{64}$/i.test(password.trim());
};

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('admin_users').select('*').order('created_at');
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('Supabase getAdminUsers fallback:', err);
    }
  }
  return getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
};

export const addAdminUser = async (user: Omit<AdminUser, 'id'>): Promise<AdminUser> => {
  const hashedPassword = await hashPassword(user.password || '');
  const newUser: AdminUser = {
    ...user,
    password: hashedPassword,
    id: `u_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert([newUser])
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase addAdminUser fallback:', err);
    }
  }

  const current = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
  const updated = [...current, newUser];
  setLocalData('admin_users', updated);
  return newUser;
};

export const updateAdminUser = async (id: string, updates: Partial<AdminUser>): Promise<AdminUser | null> => {
  const processedUpdates: Partial<AdminUser> = { ...updates };

  // หากมีการเปลี่ยนรหัสผ่าน ให้ทำการ Hash รหัสผ่านใหม่ด้วย SHA-256 ทันที
  if (updates.password && updates.password.trim()) {
    processedUpdates.password = await hashPassword(updates.password.trim());
  } else {
    delete processedUpdates.password;
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .update(processedUpdates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase updateAdminUser fallback:', err);
    }
  }

  const current = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
  const index = current.findIndex((u) => u.id === id);
  if (index !== -1) {
    const updatedUser = { ...current[index], ...processedUpdates };
    current[index] = updatedUser;
    setLocalData('admin_users', current);
    return updatedUser;
  }
  return null;
};

export const deleteAdminUser = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('admin_users').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteAdminUser fallback:', err);
    }
  }

  const current = getLocalData<AdminUser[]>('admin_users', DEFAULT_ADMIN_USERS);
  const updated = current.filter((u) => u.id !== id);
  setLocalData('admin_users', updated);
  return true;
};

export const verifyAdminLogin = async (username: string, password: string): Promise<AdminUser | null> => {
  const users = await getAdminUsers();
  const hashedInput = await hashPassword(password);
  
  const matched = users.find((u) => {
    if (u.username.toLowerCase() !== username.trim().toLowerCase()) return false;
    // ตรวจสอบทั้งกรณีที่ถูก Hash ด้วย SHA-256 และกรณีรหัสผ่านข้อความเดิม (Backward Compatibility)
    return u.password === hashedInput || u.password === password;
  });
  return matched || null;
};

/**
 * ยกระดับบัญชีผู้ใช้เดิมที่เป็น Plain Text ให้เข้ารหัส SHA-256 ทั้งหมด
 */
export const upgradeLegacyPasswordsToHash = async (): Promise<number> => {
  const users = await getAdminUsers();
  let count = 0;
  for (const u of users) {
    if (u.password && !isPasswordHashed(u.password)) {
      await updateAdminUser(u.id, { password: u.password });
      count++;
    }
  }
  return count;
};

// ==========================================
// 3. จัดการคำถามแบบประเมิน (Survey Questions)
// ==========================================

export const getSurveyQuestions = async (): Promise<SurveyQuestion[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('survey_config')
        .select('*')
        .order('order_no', { ascending: true });
      if (error) throw error;
      if (data) {
        const local = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
        const localTypeMap = new Map(local.map((q) => [q.id, q.question_type]));
        const merged: SurveyQuestion[] = data.map((q: any) => {
          let resolvedType = q.question_type || localTypeMap.get(q.id);
          // Smart fallback: หากฐานข้อมูลยังไม่ได้เพิ่มคอลัมน์ question_type ให้ตรวจจับจากเนื้อหาคำถามอัตโนมัติ
          if (!resolvedType) {
            const txt = (q.question_text || '').toLowerCase();
            if (
              txt.includes('อย่างไรบ้าง') ||
              txt.includes('ข้อเสนอแนะ') ||
              txt.includes('เขียนตอบ') ||
              txt.includes('ปรับปรุงการสอน') ||
              txt.includes('ความประทับใจ')
            ) {
              resolvedType = 'text';
            } else {
              resolvedType = 'rating';
            }
          }
          return {
            ...q,
            question_type: resolvedType,
          };
        });
        setLocalData('survey_config', merged);
        return merged;
      }
    } catch (err) {
      console.warn('Supabase getSurveyQuestions fallback to local data:', err);
    }
  }
  return getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
};

export const addSurveyQuestion = async (
  question: Omit<SurveyQuestion, 'id'>
): Promise<SurveyQuestion> => {
  const newQuestion: SurveyQuestion = {
    ...question,
    id: `q_${Date.now()}`,
    question_type: question.question_type || 'rating',
  };

  if (isSupabaseConfigured()) {
    try {
      let insertPayload: any = { ...newQuestion };
      let { data, error } = await supabase
        .from('survey_config')
        .insert([insertPayload])
        .select()
        .single();

      // If question_type column does not exist yet in Supabase schema cache (PGRST204), retry without it
      if (error && (error.code === 'PGRST204' || error.message?.includes('question_type'))) {
        delete insertPayload.question_type;
        const retry = await supabase
          .from('survey_config')
          .insert([insertPayload])
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (data) {
        const savedQuestion = { ...newQuestion, ...data };
        const current = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
        const updated = [...current, savedQuestion];
        setLocalData('survey_config', updated);
        return savedQuestion;
      }
    } catch (err) {
      console.warn('Supabase addSurveyQuestion fallback to local data:', err);
    }
  }

  const current = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
  const updated = [...current, newQuestion];
  setLocalData('survey_config', updated);
  return newQuestion;
};

export const updateSurveyQuestion = async (
  id: string,
  updates: Partial<SurveyQuestion>
): Promise<SurveyQuestion | null> => {
  if (isSupabaseConfigured()) {
    try {
      let updatePayload: any = { ...updates };
      let { data, error } = await supabase
        .from('survey_config')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      // If question_type column does not exist yet in Supabase schema cache (PGRST204), retry without it
      if (error && (error.code === 'PGRST204' || error.message?.includes('question_type'))) {
        delete updatePayload.question_type;
        const retry = await supabase
          .from('survey_config')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (data) {
        const savedData = { ...data, ...updates };
        const current = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
        const index = current.findIndex((q) => q.id === id);
        if (index !== -1) {
          current[index] = savedData;
        } else {
          current.push(savedData);
        }
        setLocalData('survey_config', current);
        return savedData;
      }
    } catch (err) {
      console.warn('Supabase updateSurveyQuestion fallback to local data:', err);
    }
  }

  const current = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
  const index = current.findIndex((q) => q.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates };
    setLocalData('survey_config', current);
    return current[index];
  }
  return null;
};

export const deleteSurveyQuestion = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('survey_config').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase deleteSurveyQuestion fallback to local data:', err);
    }
  }

  // อัปเดต LocalStorage เสมอ เพื่อให้ข้อมูลตรงกันทั้งฝั่งเครื่องและฝั่ง Supabase
  const current = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
  const filtered = current.filter((q) => q.id !== id);
  setLocalData('survey_config', filtered);
  return true;
};

// ==========================================
// 4. บันทึกและดึงผลการประเมิน (Evaluation Responses)
// ==========================================

export const saveEvaluationResponse = async (
  response: Omit<SurveyResponse, 'id' | 'created_at'>
): Promise<SurveyResponse> => {
  const combinedFeedback = response.feedback || (
    [response.suggestion, response.impression].filter(Boolean).join(' | ')
  );

  const newResponse: SurveyResponse = {
    ...response,
    id: `res_${Date.now()}`,
    feedback: combinedFeedback,
    suggestion: response.suggestion || '',
    impression: response.impression || '',
    text_answers: response.text_answers || {},
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const payload: any = {
      teacher_id: response.teacher_id,
      academic_year: response.academic_year,
      term: response.term,
      gender: response.gender || 'ไม่ระบุเพศ',
      education_level: response.education_level || 'ปวช.1',
      major: response.major || 'สาขาวิชาพืชศาสตร์',
      scores: response.scores || {},
      average_score: response.average_score,
      feedback: combinedFeedback,
      suggestion: response.suggestion || '',
      impression: response.impression || '',
    };

    if (response.text_answers && Object.keys(response.text_answers).length > 0) {
      payload.text_answers = response.text_answers;
    }

    try {
      const { data, error } = await supabase
        .from('responses')
        .insert([payload])
        .select()
        .single();
      if (error) {
        // If error is due to missing text_answers column in Supabase (PGRST204), retry without it
        if (error.code === 'PGRST204' || error.message?.includes('text_answers')) {
          delete payload.text_answers;
          const retry = await supabase.from('responses').insert([payload]).select().single();
          if (retry.error) throw retry.error;
          if (retry.data) return { ...newResponse, id: retry.data.id };
        }
        throw error;
      }
      if (data) return { ...newResponse, id: data.id };
    } catch (err) {
      console.warn('Supabase saveEvaluationResponse fallback to local:', err);
    }
  }

  const current = getLocalData<SurveyResponse[]>('responses', DEFAULT_RESPONSES);
  const updated = [newResponse, ...current];
  setLocalData('responses', updated);
  return newResponse;
};

export const getEvaluationResponses = async (): Promise<SurveyResponse[]> => {
  const teachers = await getTeachers();
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        return data.map((r: any) => {
          const t = teacherMap.get(r.teacher_id);
          return {
            id: r.id,
            teacher_id: r.teacher_id,
            teacher_name: t?.name || `อาจารย์ (${r.teacher_id})`,
            department: t?.department || 'แผนกวิชาทั่วไป',
            academic_year: r.academic_year,
            term: r.term,
            gender: r.gender || 'ไม่ระบุเพศ',
            education_level: r.education_level || 'ปวช.1',
            major: r.major || 'สาขาวิชาพืชศาสตร์',
            scores: r.scores || {},
            text_answers: r.text_answers || {},
            average_score: Number(r.average_score) || 0,
            feedback: r.feedback || '',
            suggestion: r.suggestion || '',
            impression: r.impression || '',
            created_at: r.created_at,
          };
        });
      }
    } catch (err) {
      console.warn('Supabase getEvaluationResponses fallback to local:', err);
    }
  }

  const list = getLocalData<SurveyResponse[]>('responses', DEFAULT_RESPONSES);
  return list.map((r) => {
    const t = teacherMap.get(r.teacher_id);
    return {
      ...r,
      gender: r.gender || 'ไม่ระบุเพศ',
      education_level: r.education_level || 'ปวช.1',
      major: r.major || 'สาขาวิชาพืชศาสตร์',
      teacher_name: r.teacher_name || t?.name || 'อาจารย์',
      department: r.department || t?.department || 'แผนกวิชาทั่วไป',
      suggestion: r.suggestion || '',
      impression: r.impression || '',
    };
  });
};

// ==========================================
// 5. จัดการปีการศึกษาและภาคเรียน (Academic Periods)
// ==========================================

const DEFAULT_ACADEMIC_PERIODS: AcademicPeriod[] = [
  { id: 'p1', academic_year: '2568', term: '2', is_active: true, total_students: 1848, created_at: '2025-10-15T00:00:00.000Z' },
  { id: 'p2', academic_year: '2568', term: '1', is_active: false, total_students: 1820, created_at: '2025-05-15T00:00:00.000Z' },
  { id: 'p3', academic_year: '2567', term: '2', is_active: false, total_students: 1780, created_at: '2024-10-15T00:00:00.000Z' },
  { id: 'p4', academic_year: '2567', term: '1', is_active: false, total_students: 1750, created_at: '2024-05-15T00:00:00.000Z' },
];

export const getAcademicPeriods = async (): Promise<AcademicPeriod[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('academic_periods')
        .select('*')
        .order('academic_year', { ascending: false });
      if (error) throw error;
      if (data && data.length > 0) return data;
    } catch (err) {
      console.warn('Supabase getAcademicPeriods fallback to local:', err);
    }
  }

  return getLocalData<AcademicPeriod[]>('academic_periods', DEFAULT_ACADEMIC_PERIODS);
};

export const getActiveAcademicPeriod = async (): Promise<AcademicPeriod> => {
  const periods = await getAcademicPeriods();
  const active = periods.find((p) => p.is_active);
  if (active) return active;
  if (periods.length > 0) return periods[0];
  return { id: 'default', academic_year: '2568', term: '2', is_active: true, total_students: 1848 };
};

export const addAcademicPeriod = async (period: {
  academic_year: string;
  term: string;
  is_active?: boolean;
  total_students?: number;
}): Promise<AcademicPeriod> => {
  const newPeriod: AcademicPeriod = {
    id: `period_${Date.now()}`,
    academic_year: period.academic_year.trim(),
    term: period.term.trim(),
    is_active: Boolean(period.is_active),
    total_students: Number(period.total_students) || 1848,
    created_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      if (newPeriod.is_active) {
        await supabase.from('academic_periods').update({ is_active: false }).neq('id', 'temp');
      }
      const { data, error } = await supabase
        .from('academic_periods')
        .insert([newPeriod])
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase addAcademicPeriod fallback to local:', err);
    }
  }

  let current = getLocalData<AcademicPeriod[]>('academic_periods', DEFAULT_ACADEMIC_PERIODS);
  if (newPeriod.is_active) {
    current = current.map((p) => ({ ...p, is_active: false }));
  }
  const updated = [newPeriod, ...current];
  setLocalData('academic_periods', updated);
  return newPeriod;
};

export const updateAcademicPeriod = async (
  id: string,
  updates: Partial<AcademicPeriod>
): Promise<AcademicPeriod | null> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('academic_periods')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase updateAcademicPeriod fallback:', err);
    }
  }

  const current = getLocalData<AcademicPeriod[]>('academic_periods', DEFAULT_ACADEMIC_PERIODS);
  const idx = current.findIndex((p) => p.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...updates };
    setLocalData('academic_periods', current);
    return current[idx];
  }
  return null;
};

export const deleteAcademicPeriod = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('academic_periods').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteAcademicPeriod fallback to local:', err);
    }
  }

  const current = getLocalData<AcademicPeriod[]>('academic_periods', DEFAULT_ACADEMIC_PERIODS);
  const target = current.find((p) => p.id === id);
  const updated = current.filter((p) => p.id !== id);
  if (target?.is_active && updated.length > 0) {
    updated[0].is_active = true;
  }
  setLocalData('academic_periods', updated);
  return true;
};

export const setActiveAcademicPeriod = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('academic_periods').update({ is_active: false }).neq('id', 'temp');
      const { error } = await supabase.from('academic_periods').update({ is_active: true }).eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase setActiveAcademicPeriod fallback to local:', err);
    }
  }

  const current = getLocalData<AcademicPeriod[]>('academic_periods', DEFAULT_ACADEMIC_PERIODS);
  const updated = current.map((p) => ({
    ...p,
    is_active: p.id === id,
  }));
  setLocalData('academic_periods', updated);
  return true;
};

// ==========================================
// 6. จัดการระดับชั้นเรียน (Education Levels)
// ==========================================

export const DEFAULT_EDUCATION_LEVELS: EducationLevel[] = [
  { id: 'el-1', name: 'ปวช.1', order_no: 1 },
  { id: 'el-2', name: 'ปวช.2', order_no: 2 },
  { id: 'el-3', name: 'ปวช.3', order_no: 3 },
  { id: 'el-4', name: 'ปวส.1', order_no: 4 },
  { id: 'el-5', name: 'ปวส.2', order_no: 5 },
  { id: 'el-6', name: 'ปริญญาตรี', order_no: 6 },
];

export const getEducationLevels = async (): Promise<EducationLevel[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .select('*')
        .order('order_no', { ascending: true });
      if (error) throw error;
      if (data) {
        setLocalData('education_levels', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getEducationLevels fallback to local:', err);
    }
  }
  return getLocalData<EducationLevel[]>('education_levels', DEFAULT_EDUCATION_LEVELS);
};

export const addEducationLevel = async (name: string, order_no?: number): Promise<EducationLevel> => {
  const current = getLocalData<EducationLevel[]>('education_levels', DEFAULT_EDUCATION_LEVELS);
  const newLevel: EducationLevel = {
    id: `el_${Date.now()}`,
    name: name.trim(),
    order_no: order_no || current.length + 1,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('education_levels')
        .insert([newLevel])
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase addEducationLevel fallback to local:', err);
    }
  }

  const updated = [...current, newLevel];
  setLocalData('education_levels', updated);
  return newLevel;
};

export const deleteEducationLevel = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('education_levels').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteEducationLevel fallback to local:', err);
    }
  }

  const current = getLocalData<EducationLevel[]>('education_levels', DEFAULT_EDUCATION_LEVELS);
  const updated = current.filter((l) => l.id !== id);
  setLocalData('education_levels', updated);
  return true;
};

// ==========================================
// 7. จัดการสาขาวิชา (Majors Management)
// ==========================================

export const DEFAULT_MAJORS: Major[] = [
  { id: 'maj-1', name: 'สาขาวิชาพืชศาสตร์', department: 'แผนกวิชาพืชศาสตร์', order_no: 1 },
  { id: 'maj-2', name: 'สาขาวิชาสัตวศาสตร์', department: 'แผนกวิชาสัตวศาสตร์', order_no: 2 },
  { id: 'maj-3', name: 'สาขาวิชาช่างกลเกษตร', department: 'แผนกวิชาช่างกลเกษตร', order_no: 3 },
  { id: 'maj-4', name: 'สาขาวิชาอุตสาหกรรมเกษตร', department: 'แผนกวิชาอุตสาหกรรมเกษตร', order_no: 4 },
  { id: 'maj-5', name: 'สาขาวิชาธุรกิจเกษตร', department: 'แผนกวิชาพืชศาสตร์', order_no: 5 },
  { id: 'maj-6', name: 'สาขาวิชาการบัญชี', department: 'แผนกวิชาการบัญชี', order_no: 6 },
  { id: 'maj-7', name: 'สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล', department: 'แผนกวิชาเทคโนโลยีสารสนเทศ', order_no: 7 },
  { id: 'maj-8', name: 'สาขาวิชาเทคโนโลยีสารสนเทศ', department: 'แผนกวิชาเทคโนโลยีสารสนเทศ', order_no: 8 },
];

export const getMajors = async (): Promise<Major[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('majors')
        .select('*')
        .order('order_no', { ascending: true });
      if (error) throw error;
      if (data) {
        setLocalData('majors', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getMajors fallback to local:', err);
    }
  }
  return getLocalData<Major[]>('majors', DEFAULT_MAJORS);
};

export const addMajor = async (name: string, department?: string, order_no?: number): Promise<Major> => {
  const current = getLocalData<Major[]>('majors', DEFAULT_MAJORS);
  const newMajor: Major = {
    id: `maj_${Date.now()}`,
    name: name.trim(),
    department: department ? department.trim() : 'แผนกวิชาทั่วไป',
    order_no: order_no || current.length + 1,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('majors')
        .insert([newMajor])
        .select()
        .single();
      if (error) throw error;
      if (data) return data;
    } catch (err) {
      console.warn('Supabase addMajor fallback to local:', err);
    }
  }

  const updated = [...current, newMajor];
  setLocalData('majors', updated);
  return newMajor;
};

export const deleteMajor = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('majors').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err) {
      console.warn('Supabase deleteMajor fallback to local:', err);
    }
  }

  const current = getLocalData<Major[]>('majors', DEFAULT_MAJORS);
  const updated = current.filter((m) => m.id !== id);
  setLocalData('majors', updated);
  return true;
};

// ==========================================
// 8. จัดการแผนกวิชา (Departments Management)
// ==========================================

export const DEFAULT_DEPARTMENTS: Department[] = [
  { id: 'dep-1', name: 'แผนกวิชาพืชศาสตร์', order_no: 1 },
  { id: 'dep-2', name: 'แผนกวิชาสัตวศาสตร์', order_no: 2 },
  { id: 'dep-3', name: 'แผนกวิชาช่างกลเกษตร', order_no: 3 },
  { id: 'dep-4', name: 'แผนกวิชาอุตสาหกรรมเกษตร', order_no: 4 },
  { id: 'dep-5', name: 'แผนกวิชาประมง', order_no: 5 },
  { id: 'dep-6', name: 'แผนกวิชาเทคโนโลยีสารสนเทศ', order_no: 6 },
  { id: 'dep-7', name: 'แผนกวิชาการบัญชีและการจัดการ', order_no: 7 },
  { id: 'dep-8', name: 'แผนกวิชาสามัญสัมพันธ์', order_no: 8 },
];

export const getDepartments = async (): Promise<Department[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('order_no', { ascending: true });
      if (error) throw error;
      if (data) {
        setLocalData('departments', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getDepartments fallback to local:', err);
    }
  }
  return getLocalData<Department[]>('departments', DEFAULT_DEPARTMENTS);
};

export const addDepartment = async (name: string, order_no?: number): Promise<Department> => {
  const current = getLocalData<Department[]>('departments', DEFAULT_DEPARTMENTS);
  const newDept: Department = {
    id: `dep_${Date.now()}`,
    name: name.trim(),
    order_no: order_no || current.length + 1,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .insert([newDept])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        const updated = [...current, data];
        setLocalData('departments', updated);
        return data;
      }
    } catch (err) {
      console.warn('Supabase addDepartment fallback to local:', err);
    }
  }

  const updated = [...current, newDept];
  setLocalData('departments', updated);
  return newDept;
};

export const deleteDepartment = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase deleteDepartment fallback to local:', err);
    }
  }

  const current = getLocalData<Department[]>('departments', DEFAULT_DEPARTMENTS);
  const updated = current.filter((d) => d.id !== id);
  setLocalData('departments', updated);
  return true;
};

// ==========================================
// 9. จัดการด้านการประเมิน (Survey Categories Management)
// ==========================================

export const DEFAULT_CATEGORIES: SurveyCategory[] = [
  { id: 'cat-1', name: 'ด้านการสอนและการถ่ายทอดความรู้', order_no: 1 },
  { id: 'cat-2', name: 'ด้านความเอาใจใส่และปฏิสัมพันธ์', order_no: 2 },
  { id: 'cat-3', name: 'ด้านสื่อและเทคนิคการจัดการเรียนรู้', order_no: 3 },
  { id: 'cat-4', name: 'ด้านประโยชน์และการนำไปใช้', order_no: 4 },
  { id: 'cat-5', name: 'ด้านคุณธรรม จริยธรรม และจรรยาบรรณวิชาชีพ', order_no: 5 },
];

export const getSurveyCategories = async (): Promise<SurveyCategory[]> => {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('survey_categories')
        .select('*')
        .order('order_no', { ascending: true });
      if (error) throw error;
      if (data) {
        setLocalData('survey_categories', data);
        return data;
      }
    } catch (err) {
      console.warn('Supabase getSurveyCategories fallback to local:', err);
    }
  }
  return getLocalData<SurveyCategory[]>('survey_categories', DEFAULT_CATEGORIES);
};

export const addSurveyCategory = async (name: string, order_no?: number): Promise<SurveyCategory> => {
  const current = getLocalData<SurveyCategory[]>('survey_categories', DEFAULT_CATEGORIES);
  const newCat: SurveyCategory = {
    id: `cat_${Date.now()}`,
    name: name.trim(),
    order_no: order_no || current.length + 1,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('survey_categories')
        .insert([newCat])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        const updated = [...current, data];
        setLocalData('survey_categories', updated);
        return data;
      }
    } catch (err) {
      console.warn('Supabase addSurveyCategory fallback to local:', err);
    }
  }

  const updated = [...current, newCat];
  setLocalData('survey_categories', updated);
  return newCat;
};

export const updateSurveyCategory = async (
  id: string,
  newName: string,
  oldName?: string,
  order_no?: number
): Promise<SurveyCategory | null> => {
  const trimmedNew = newName.trim();
  const updatePayload: Partial<SurveyCategory> = { name: trimmedNew };
  if (order_no !== undefined) updatePayload.order_no = order_no;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('survey_categories')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Cascade update questions if category name changed
      if (oldName && oldName !== trimmedNew) {
        await supabase
          .from('survey_config')
          .update({ category: trimmedNew })
          .eq('category', oldName);
      }

      if (data) {
        const current = getLocalData<SurveyCategory[]>('survey_categories', DEFAULT_CATEGORIES);
        const updated = current.map((c) => (c.id === id ? data : c));
        setLocalData('survey_categories', updated);

        if (oldName && oldName !== trimmedNew) {
          const questions = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
          const updatedQ = questions.map((q) =>
            q.category === oldName ? { ...q, category: trimmedNew } : q
          );
          setLocalData('survey_config', updatedQ);
        }
        return data;
      }
    } catch (err) {
      console.warn('Supabase updateSurveyCategory fallback to local:', err);
    }
  }

  const current = getLocalData<SurveyCategory[]>('survey_categories', DEFAULT_CATEGORIES);
  const index = current.findIndex((c) => c.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updatePayload };
    setLocalData('survey_categories', current);

    if (oldName && oldName !== trimmedNew) {
      const questions = getLocalData<SurveyQuestion[]>('survey_config', DEFAULT_QUESTIONS);
      const updatedQ = questions.map((q) =>
        q.category === oldName ? { ...q, category: trimmedNew } : q
      );
      setLocalData('survey_config', updatedQ);
    }
    return current[index];
  }
  return null;
};

export const deleteSurveyCategory = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('survey_categories').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.warn('Supabase deleteSurveyCategory fallback to local:', err);
    }
  }

  const current = getLocalData<SurveyCategory[]>('survey_categories', DEFAULT_CATEGORIES);
  const updated = current.filter((c) => c.id !== id);
  setLocalData('survey_categories', updated);
  return true;
};

