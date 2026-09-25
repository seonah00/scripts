import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase/server';
import Studio from './studio';
export const dynamic='force-dynamic';
export default async function Home(){const id=await identity();if(!id)redirect('/login');if(id.member?.status!=='active')redirect('/pending');return <><div className="account-strip"><span>{id.user.email}</span>{id.member.role==='admin'&&<a href="/admin">수강생 관리</a>}<a href="/account/password">비밀번호 변경</a><form action="/logout" method="post"><button>로그아웃</button></form></div><Studio/></>;}
