import {NextResponse} from 'next/server';
import {supabase} from '@/lib/supabase/server';
export async function GET(req:Request){
 const url=new URL(req.url);const origin=new URL(process.env.APP_URL!).origin;
 const token_hash=url.searchParams.get('token_hash');const type=url.searchParams.get('type');
 if(token_hash&&(type==='signup'||type==='recovery'||type==='email')){
 const client=await supabase();const {error}=await client.auth.verifyOtp({token_hash,type});
 if(!error)return NextResponse.redirect(new URL(type==='recovery'?'/account/password':'/',origin));
 }
 return NextResponse.redirect(new URL('/login?error=expired',origin));
}
