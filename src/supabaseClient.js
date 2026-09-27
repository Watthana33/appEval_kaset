import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// กำหนดเวลา Timeout สูงสุดสำหรับคำขอไปยัง Supabase (5 วินาที)
// ป้องกันหน้าเว็บหมุนค้างตลอดกาลเมื่อเน็ตเวิร์ก ไฟร์วอลล์ หรือส่วนขยายของเบราว์เซอร์มีปัญหา
const REQUEST_TIMEOUT_MS = 5000;

const fetchWithTimeout = (url, options = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      controller.abort();
    });
  }

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
  });
};

// สร้าง Supabase Client พร้อมระบบ Anti-Hang Timeout
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
