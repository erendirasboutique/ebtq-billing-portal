import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export async function GET(req){
  try{
    const auth=req.headers.get('authorization')||''; const token=auth.replace('Bearer ','');
    if(!token) return NextResponse.json({error:'Missing login token.'},{status:401});
    const supabase=getSupabaseAdmin(); const {data,error}=await supabase.auth.getUser(token);
    if(error || !data?.user?.email) return NextResponse.json({error:'Invalid session.'},{status:401});
    const email=data.user.email.toLowerCase();
    const {data:payments=[],error:payError}=await supabase.from('payments').select('*').eq('customer_email',email).order('created_at',{ascending:false});
    if(payError) return NextResponse.json({error:payError.message},{status:500});
    return NextResponse.json({payments});
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
