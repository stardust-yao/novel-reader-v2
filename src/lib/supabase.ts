import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvnaueanurumlqqebthz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bmF1ZWFudXJ1bWxxcWVidGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1ODUyOTQsImV4cCI6MjA5OTE2MTI5NH0.2bwHRMW6FgWWHabyHZxcjrc47-vBAB4hGVOsGzFnHoo'

const g = globalThis as typeof globalThis & { __supabase?: SupabaseClient }
if (!g.__supabase) {
  g.__supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
export const supabase = g.__supabase

export interface BookRecord {
  id: string
  title: string
  uploader: string
  chapter_count: number
  moment_count: number
  file_content?: string
  created_at: string
}
