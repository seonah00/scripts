import {z} from 'zod';
import {supabase,configured} from '@/lib/supabase/server';
import {AppError,errorResponse,sameOrigin,payload} from '@/lib/server';
export async function POST(req:Request){try{
 sameOrigin(req);if(!configured())throw new AppError('로그인 서비스 연결을 준비 중입니다.',503);
 const body=await payload(req);const client=await supabase();const origin=new URL(process.env.APP_URL!).origin;
 if(body.action==='logout'){const {error}=await client.auth.signOut();if(error)throw new AppError('로그아웃에 실패했습니다. 다시 시도해 주세요.',503);return Response.json({ok:true});}
 if(body.action==='update'){const password=z.string().min(12).max(128).parse(body.password);const {data:{user}}=await client.auth.getUser();if(!user)throw new AppError('재설정 링크를 다시 열어 주세요.',401);const {error}=await client.auth.updateUser({password});if(error)throw new AppError('비밀번호 변경에 실패했습니다. 새 링크를 요청해 주세요.');await client.auth.signOut({scope:'global'});return Response.json({ok:true});}
 const email=z.string().email().max(254).parse(body.email);
 if(body.action==='reset'){await client.auth.resetPasswordForEmail(email,{redirectTo:origin+'/account/password'});return Response.json({message:'가입된 이메일이면 비밀번호 재설정 안내가 발송됩니다.'});}
 const password=z.string().min(body.action==='signup'?12:1).max(128).parse(body.password);
 if(body.action==='signup'){
 const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:origin+'/auth/confirm'}});
 if(error)throw new AppError('가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
 return Response.json({message:'이메일의 인증 링크를 확인해 주세요. 인증 후 운영자가 수강 권한을 승인합니다.'});}
 if(body.action!=='login')throw new AppError('지원하지 않는 요청입니다.');
 const {error}=await client.auth.signInWithPassword({email,password});
 if(error)throw new AppError('이메일·비밀번호 또는 이메일 인증 여부를 확인해 주세요.',401);
 return Response.json({ok:true});
 }catch(e){return errorResponse(e);}}
