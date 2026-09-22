// ตั้งค่า Supabase URL และ Anon Key
// คุณสามารถแทนที่ค่าด้านล่างด้วย URL และ Anon Key จริงจาก Supabase Project Settings > API
// หรือสร้างไฟล์ .env แล้วใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ได้เช่นกัน

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://your-supabase-project.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key";

// ฟังก์ชันตรวจสอบว่าได้ใส่ค่า Supabase URL & Key จริงหรือยัง
export const isSupabaseConfigured = () => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes("your-supabase-project") &&
    !SUPABASE_ANON_KEY.includes("your-anon-key")
  );
};
