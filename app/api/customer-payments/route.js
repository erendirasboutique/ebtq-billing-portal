import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
export async function GET(req){
  const auth=req.headers.get('authorization')||''; const token=auth.replace('Bearer ','');
  if(!token) return Response.json({error:'Not logged in.'},{status:401});
  const supabase=getSupabaseAdmin();
  const { data:userData, error:userError } = await supabase.auth.getUser(token);
  if(userError || !userData?.user?.email) return Response.json({error:'Invalid session.'},{status:401});
  const email=userData.user.email.toLowerCase();
  const { data:payments, error } = await supabase.from('payments').select('*').eq('customer_email', email).order('created_at',{ascending:false});
  if(error) return Response.json({error:error.message},{status:500});
  return Response.json({payments:payments||[]});
}
