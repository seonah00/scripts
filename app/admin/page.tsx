import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase/server';
import Members from './members';
export const dynamic='force-dynamic';
export default async function Admin(){const id=await identity();if(!id)redirect('/login');if(id.member?.status!=='active'||id.member.role!=='admin')redirect('/');return <Members/>;}
