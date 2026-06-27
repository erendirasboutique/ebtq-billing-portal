import { cookies } from 'next/headers';
export async function POST(){ const cookieStore=await cookies(); cookieStore.set('eb_admin_access_token','',{path:'/',maxAge:0}); return Response.json({ok:true}); }
