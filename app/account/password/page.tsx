import {redirect} from 'next/navigation';
import {identity} from '@/lib/supabase/server';
import AuthForm from '@/app/ui/auth-form';
export const dynamic='force-dynamic';
export default async function Password(){if(!await identity())redirect('/login');return <AuthForm configured initialMode="update"/>;}
