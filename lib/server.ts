import {identity,adminClient} from './supabase/server';
export class AppError extends Error {constructor(message:string,public status=400){super(message);}}
export function sameOrigin(req:Request){
 const expected=process.env.APP_URL;if(!expected)throw new AppError('서비스 주소 설정이 필요합니다.',503);
 if(req.headers.get('origin')!==new URL(expected).origin)throw new AppError('허용되지 않은 요청입니다.',403);
}
export async function actor(req?:Request){
 if(req)sameOrigin(req);
 const id=await identity();if(!id)throw new AppError('로그인해 주세요.',401);
 if(id.member?.status!=='active')throw new AppError('수강 승인 후 사용할 수 있습니다.',403);
 return {...id,userId:id.user.id};
}
export function errorResponse(error:unknown){
 if(error instanceof AppError)return Response.json({error:error.message},{status:error.status});
 if(error&&typeof error==='object'&&'name'in error&&error.name==='ZodError')return Response.json({error:'입력 내용을 확인해 주세요.'},{status:400});
 console.error('studio operation failed',error instanceof Error?error.name:'unknown');
 return Response.json({error:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:500});
}
export async function payload(req:Request){
 const reader=req.body?.getReader();if(!reader)throw new AppError('입력이 필요합니다.');
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>150000){await reader.cancel();throw new AppError('입력 내용이 너무 깁니다.',413);}chunks.push(value);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AppError('입력 형식을 확인해 주세요.');}
}
export async function reserveUsage(owner:string){const {data,error}=await adminClient().rpc('gv_reserve_usage',{p_owner:owner});if(error)throw new AppError('사용량을 확인하지 못했습니다.',503);if(!data)throw new AppError('오늘의 AI 요청 한도(30회)에 도달했거나 수강 권한이 없습니다.',429);}
export const runtime=()=>process.env;
