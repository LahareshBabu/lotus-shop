import { createClient } from '@supabase/supabase-js'

// 1. PASTE YOUR PROJECT URL INSIDE THE QUOTES BELOW:
const supabaseUrl = "https://fwyliqsazdyprlkemavu.supabase.co"

// 2. PASTE YOUR LONG 'ANON' KEY INSIDE THE QUOTES BELOW:
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3eWxpcXNhemR5cHJsa2VtYXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzOTg2MzIsImV4cCI6MjA4NTk3NDYzMn0.dXkx1pEtiZ5uwcQJgisJs14ZyUJTuz-SomMCeZv-jbE"
export const supabase = createClient(supabaseUrl, supabaseKey)