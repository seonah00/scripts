import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase/server';
import Members from './members';
export const dynamic='force-dynamic';
export default async function Admin(){const id=await identity();if(!id)redirect('/login');if(id.member?.status!=='active'||id.member.role!=='admin')redirect('/');return <><div style={{padding:16,textAlign:'right'}}><a href="/admin/expressions">플랫폼 표현 자동 갱신 상태 →</a></div><Members/></>;}
