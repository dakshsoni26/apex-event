import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://tkqkgdeiqjquspnvwtmz.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrcWtnZGVpcWpxdXNwbnZ3dG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNTA1NTIsImV4cCI6MjA4NzYyNjU1Mn0.9_a8QmMJATmKenZczn_65UG-ZbUiW8DK3CUjF_IIw6w'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
