import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req){
  try{
    const { accessToken } = await req.json();
    if(!accessToken) return NextResponse.json({error:'Missing access token.'},{status:400});
    const supabase=getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if(error || !data?.user?.email) return NextResponse.json({error:'Invalid login.'},{status:401});
    const email=data.user.email.toLowerCase();
    const { data: adminUser, error: adminError } = await supabase.from('admins').select('id,email,role,active').eq('email',email).eq('active',true).maybeSingle();
    if(adminError || !adminUser) return NextResponse.json({error:'This account is not an active admin.'},{status:403});
    const res=NextResponse.json({success:true});
    res.cookies.set('eb_admin_access_token', accessToken, { httpOnly:true, sameSite:'lax', secure:true, path:'/', maxAge:60*60*8 });
    return res;
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
