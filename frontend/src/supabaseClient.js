import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://tpilqfadltymkllpjkwq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwaWxxZmFkbHR5bWtsbHBqa3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjg2MzAsImV4cCI6MjA4NzY0NDYzMH0.psgrUzkrljYKQ3dISmhup-ej29P2woLtE3N__p4KRpY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)