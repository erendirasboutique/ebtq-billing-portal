import { createClient } from '@supabase/supabase-js';

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key';
  return createClient(url, key);
}
