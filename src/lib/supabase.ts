import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://hpqfxtvhmutzypmubbyl.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcWZ4dHZobXV0enlwbXViYnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTM0NzIsImV4cCI6MjA3MzgyOTQ3Mn0.qeKfjK7FtSthMD1zZE8cibeX3GnWOnAXL365bYzddn8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});
