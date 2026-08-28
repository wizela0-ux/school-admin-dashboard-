import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jiqbhuxbxxrzstleitkd.supabase.co';
const SUPABASE_KEY = 'የወሰድከው_PUBLISHABLE_KEY'; // ከ Supabase የተቀበልከውን Publishable Key እዚህ ተካ

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
