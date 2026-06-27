'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { copy } from '@/lib/i18n';
import LanguageToggle from './LanguageToggle';

export default function AdminLogin(){
  const [lang,setLang]=useState('en'); const t=copy[lang];
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const supabase=useMemo(()=>getSupabaseBrowser(),[]); const router=useRouter();
  async function submit(e){
    e.preventDefault(); setError(''); setLoading(true);
    const {data, error: signError}=await supabase.auth.signInWithPassword({email,password});
    if(signError || !data.session?.access_token){ setError(t.wrong); setLoading(false); return; }
    const res=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({access_token:data.session.access_token})});
    const json=await res.json().catch(()=>({}));
    setLoading(false);
    if(!res.ok){ setError(json.error || t.wrong); return; }
    router.push('/admin'); router.refresh();
  }
  return <main className="page"><span className="flower one">✿</span><div className="shell"><div className="topbar"><div className="brand"><img src="/logo.png" className="logo" alt="Erendira's Boutique"/><div><div className="brand-title">Erendira&apos;s Boutique</div><p>{t.adminOnly}</p></div></div><LanguageToggle lang={lang} setLang={setLang}/></div><section className="card" style={{maxWidth:560,margin:'60px auto'}}><h1>{t.adminLogin}</h1><form onSubmit={submit}><label className="field">{t.email}<input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="field">{t.password}<input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="button" disabled={loading}>{loading?'...':t.signIn}</button></form>{error&&<div className="notice error">{error}</div>}</section></div></main>
}
