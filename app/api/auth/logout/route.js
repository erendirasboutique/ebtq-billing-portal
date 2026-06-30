import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('eb_admin_access_token');
  res.cookies.delete('sb-access-token');
  return res;
}
