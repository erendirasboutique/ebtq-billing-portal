import { redirect } from 'next/navigation';
export async function GET(req){ const url=new URL(req.url); redirect(url.searchParams.get('next') || '/customer'); }
