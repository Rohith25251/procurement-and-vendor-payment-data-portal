import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gyaddxjryvboawswxrjg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5YWRkeGpyeXZib2F3c3d4cmpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDk1MDUsImV4cCI6MjEwMjEyNTUwNX0.Ye61UbM-A93DUuhI3e9BlC2NLZN374MtiE5iHPTkiyQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
