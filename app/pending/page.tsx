import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function Pending(){const id=await identity();if(!id)redirect('/login');if(id.member?.status==='active')redirect('/');return <main className="status-shell"><div className="status-card"><span className="auth-eyebrow">GLOBALVIRAL CLASSROOM</span><h1>{id.member?.status==='suspended'?'이용이 일시 중지되었습니다':'수강 승인을 기다리고 있어요'}</h1><p>{id.user.email}</p><p>운영자가 수강 정보를 확인하면 콘텐츠 작업실을 이용할 수 있습니다.</p><a className="auth-submit" href="/">승인 상태 새로고침</a><form action="/logout" method="post"><button className="auth-secondary">로그아웃</button></form></div></main>;}
