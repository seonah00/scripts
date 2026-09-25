import {actor,errorResponse,payload,AppError,runtime,reserveUsage} from '@/lib/server';
import {profileSchema,projectSchema,briefSchema} from '@/lib/studio';
import {research,generate,rewrite} from '@/lib/ai';
export const dynamic='force-dynamic';
export async function GET(){try{
 const {client,user}=await actor();
 const [projects,profile]=await Promise.all([client.from('gv_projects').select('payload').eq('owner',user.id).order('updated_at',{ascending:false}).limit(100),client.from('gv_profiles').select('payload').eq('owner',user.id).maybeSingle()]);
 if(projects.error||profile.error)throw new AppError('저장된 데이터를 불러오지 못했습니다.',503);
 return Response.json({connected:Boolean(runtime().OPENAI_API_KEY),signedIn:true,user:user.email,projects:projects.data.map(p=>p.payload),profile:profile.data?.payload??null},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return errorResponse(e);}}
export async function POST(req:Request){try{
 const {client,user}=await actor(req);const body=await payload(req);
 if(body.action==='save'){
 const p=projectSchema.parse(body.project);p.updatedAt=new Date().toISOString();
 if(p.brief.platform==='tiktok'&&p.brief.format!=='video')throw new AppError('틱톡은 영상 형식으로 저장해 주세요.');
 const {error}=await client.from('gv_projects').upsert({id:p.id,owner:user.id,name:p.brief.name,payload:p,updated_at:p.updatedAt},{onConflict:'owner,id'});
 if(error)throw new AppError('프로젝트를 저장하지 못했습니다.',503);return Response.json({project:p});}
 if(body.action==='profile'){const p=profileSchema.parse(body.profile);const {error}=await client.from('gv_profiles').upsert({owner:user.id,payload:p});if(error)throw new AppError('프로필을 저장하지 못했습니다.',503);return Response.json({profile:p});}
 if(!['research','generate','rewrite'].includes(body.action))throw new AppError('지원하지 않는 요청입니다.');
 if(!runtime().OPENAI_API_KEY)throw new AppError('AI 연결 대기 중입니다. 샘플 또는 직접 입력을 이용해 주세요.',503);
 briefSchema.parse(body.brief);await reserveUsage(user.id);
 if(body.action==='research')return Response.json({facts:await research(body.brief)});
 if(body.action==='generate')return Response.json({result:await generate(body)});
 return Response.json({block:await rewrite(body)});
 }catch(e){return errorResponse(e);}}
