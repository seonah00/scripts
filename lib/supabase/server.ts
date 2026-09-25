import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
export function configured(){return Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY);}
export async function supabase(){
 if(!configured()) throw new Error('AUTH_NOT_CONFIGURED');
 const jar=await cookies();
 return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{
  cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},
  cookies:{getAll:()=>jar.getAll(),setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options));}catch{/* Server component cookies are refreshed by proxy. */}}}});
}
export function adminClient(){
 if(!process.env.SUPABASE_SECRET_KEY) throw new Error('ADMIN_NOT_CONFIGURED');
 return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
}
export async function identity(){
 if(!configured())return null;
 const client=await supabase();const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return null;
 const {data:member,error:memberError}=await client.from('gv_members').select('id,email,status,role').eq('id',user.id).maybeSingle();
 if(memberError)throw new Error('MEMBERSHIP_UNAVAILABLE');
 return {client,user,member};
}
