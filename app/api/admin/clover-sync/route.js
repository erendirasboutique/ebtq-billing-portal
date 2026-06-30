import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
function cloverBaseUrl(){ return process.env.CLOVER_ENV === 'sandbox' ? 'https://sandbox.dev.clover.com' : 'https://api.clover.com'; }
async function ensureAdmin(){ const cookieStore=await cookies(); const token=cookieStore.get('eb_admin_access_token')?.value; if(!token) throw new Error('Not signed in.'); const supabase=getSupabaseAdmin(); const {data,error}=await supabase.auth.getUser(token); if(error||!data?.user?.email) throw new Error('Invalid admin.'); const {data:admin}=await supabase.from('admins').select('id').eq('email',data.user.email.toLowerCase()).eq('active',true).maybeSingle(); if(!admin) throw new Error('Not authorized.'); return supabase; }
export async function POST(){
  try{
    const supabase=await ensureAdmin(); const token=process.env.CLOVER_API_TOKEN; const merchantId=process.env.CLOVER_MERCHANT_ID;
    if(!token||!merchantId) return NextResponse.json({error:'Missing CLOVER_API_TOKEN or CLOVER_MERCHANT_ID.'},{status:500});
    const url=`${cloverBaseUrl()}/v3/merchants/${merchantId}/payments?expand=cardTransaction,tender,order&limit=100`;
    const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'}); const data=await response.json();
    if(!response.ok) return NextResponse.json({error:'Could not fetch Clover payments.',details:data},{status:response.status});
    const rows=(data.elements||[]).map(payment=>({ payment_source:'clover', clover_payment_id:payment.id, clover_order_id:payment.order?.id||null, clover_merchant_id:merchantId, clover_tender:payment.tender?.label||payment.tender?.id||null, customer_name:payment.employee?.name||payment.cardTransaction?.cardholderName||'Clover Customer', customer_email:'', customer_phone:'', amount_total:Number(payment.amount||0)/100, currency:'usd', payment_status:payment.result==='SUCCESS'?'paid':(payment.result||'unknown'), refund_status:'none', payment_method:payment.cardTransaction?.cardType||'clover', payment_method_brand:payment.cardTransaction?.cardType||null, payment_method_last4:payment.cardTransaction?.last4||null, description:'Clover POS payment', created_at:payment.createdTime?new Date(payment.createdTime).toISOString():new Date().toISOString(), raw:payment }));
    if(rows.length){ const {error}=await supabase.from('payments').upsert(rows,{onConflict:'clover_payment_id'}); if(error) return NextResponse.json({error:'Clover fetched, but Supabase did not save.',details:error.message},{status:500}); }
    return NextResponse.json({success:true,imported:rows.length});
  }catch(e){ return NextResponse.json({error:e.message},{status:500}); }
}
