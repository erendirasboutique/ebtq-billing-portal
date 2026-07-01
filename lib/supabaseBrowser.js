import { createClient } from '@supabase/supabase-js';

let browserClient;

export function getSupabaseBrowser() {
  if (browserClient) return browserClient;

  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'ebtq-billing-auth',
      },
    }
  );

  return browserClient;
}
