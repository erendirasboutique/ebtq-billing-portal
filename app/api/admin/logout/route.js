import { NextResponse } from 'next/server';
export async function POST(){ const res=NextResponse.json({success:true}); res.cookies.set('eb_admin_access_token','',{path:'/',maxAge:0}); return res; }
