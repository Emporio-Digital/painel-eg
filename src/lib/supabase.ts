import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Este cliente será usado para operações no lado do cliente e escuta em tempo real (Realtime)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)