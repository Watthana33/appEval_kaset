import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// สร้าง Supabase Client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
