import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req){
  try{
    const { access_token } = await req.json();
    if(!access_token) return Response.json({error:'Missing access token.'},{status:400});
    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase.auth.getUser(access_token);
    if(userError || !userData?.user?.email) return Response.json({error:'Wrong admin email or password. Try again.'},{status:401});
    const email = userData.user.email.toLowerCase();
    const { data: adminUser, error: adminError } = await supabase.from('admins').select('email,role,active').eq('email', email).eq('active', true).maybeSingle();
    if(adminError) return Response.json({error:adminError.message},{status:500});
    if(!adminUser) return Response.json({error:'This email is not assigned as an admin.'},{status:403});
    const cookieStore = await cookies();
    cookieStore.set('eb_admin_access_token', access_token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:60*60*8 });
    return Response.json({ok:true});
  }catch(error){ return Response.json({error:error.message},{status:500}); }
}
