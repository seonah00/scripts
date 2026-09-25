import {NextResponse} from 'next/server';
import {supabase} from '@/lib/supabase/server';
import {sameOrigin,errorResponse} from '@/lib/server';
export async function POST(req:Request){try{sameOrigin(req);const client=await supabase();const {error}=await client.auth.signOut();if(error)throw error;return NextResponse.redirect(new URL('/login',process.env.APP_URL!),303);}catch(e){return errorResponse(e);}}
