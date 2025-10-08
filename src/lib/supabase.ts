import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface UserProfile {
  id: string;
  created_at: string;
  email: string;
  role: string;
  patrol_active: boolean;
  name_of_official: string;
  employee_id: string;
  beat_number: number;
  range_forest_office: string;
  division: string;
  last_update_date: string;
  latitude: number;
  longitude: number;
}

