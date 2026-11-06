import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://miintfaattvrfjrzkchc.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paW50ZmFhdHR2cmZqcnprY2hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM4NjY4NTAsImV4cCI6MjEwOTQ0Mjg1MH0.zEyrFylsMERB1ok0_2YMxLpbYabzE68WVpQBt5uJsxA'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
