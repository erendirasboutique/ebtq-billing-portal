'use client';
import { useEffect } from 'react';
import { getSupabaseBrowser } from '@/lib/supabaseBrowser';
export default function AuthCallback(){
  useEffect(()=>{ const supabase=getSupabaseBrowser(); supabase.auth.exchangeCodeForSession(window.location.href).finally(()=>{ window.location.href='/'; }); },[]);
  return <main className="page"><div className="shell"><div className="card">Signing you in...</div></div></main>;
}
