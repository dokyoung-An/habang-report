import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in .env file')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface ReportBasicInfo {
  id: string
  apt_name: string
  dong: string
  ho: string
  contact: string
  created_at: string
  user_id?: string
}

export interface ReportEquipment {
  id: string
  report_id: string
  item_name: string
  is_checked: boolean
  input_text: string
}

export interface ReportVisual {
  id: string
  report_id: string
  image_path: string
  image_url: string
  location: string
  classification: string
  details: string
}



