import {actor,errorResponse,AppError,reserveUsage,runtime as config} from '@/lib/server';
import {analyzeGuide} from '@/lib/brand-analysis';
import {GUIDE_BYTES,fileMime,readGuideURL,htmlText} from '@/lib/guide-source';
import type {AIContent} from '@/lib/ai';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:Request){try{
 const {user}=await actor(req);if(!config().OPENAI_API_KEY)throw new AppError('가이드 분석에는 OpenAI 연결이 필요합니다.',503);
 const reader=req.body?.getReader();if(!reader)throw new AppError('가이드를 입력해 주세요.');let size=0;const chunks:Uint8Array[]=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>GUIDE_BYTES+100000){await reader.cancel();throw new AppError('파일 합계는 10MB 이하로 올려 주세요.',413);}chunks.push(value);}
 const raw=Buffer.concat(chunks);let form:FormData;try{form=await new Response(raw,{headers:{'Content-Type':req.headers.get('content-type')??''}}).formData();}catch{throw new AppError('파일 업로드 형식을 확인해 주세요.');}
 const text=String(form.get('text')??'').trim();const url=String(form.get('url')??'').trim();const files=form.getAll('files').filter((v):v is File=>typeof v!=='string');if(text.length>20000||url.length>1500||files.length>8)throw new AppError('텍스트 20,000자, 링크 1,500자, 파일 8개 이내로 입력해 주세요.');if(Number(Boolean(text))+Number(Boolean(url))+Number(files.length>0)!==1)throw new AppError('링크, 파일, 텍스트 중 한 가지 방식으로 가이드를 입력해 주세요.');
 const attachments:AIContent[]=[];const sources:string[]=[];let sourceText=text;let partial=false;
 function attach(bytes:Buffer,name:string){const mime=fileMime(bytes);if(!mime)throw new AppError('PDF·JPG·PNG·WEBP 파일만 지원합니다.');const safeName=name.replace(/[\r\n]/g,' ').slice(0,160);sources.push(safeName);attachments.push({type:'input_text',text:`다음 파일: ${safeName} (업로드 순서 ${sources.length})`});const data=`data:${mime};base64,${bytes.toString('base64')}`;attachments.push(mime==='application/pdf'?{type:'input_file',filename:safeName.endsWith('.pdf')?safeName:safeName+'.pdf',file_data:data}:{type:'input_image',image_url:data,detail:'high'});}
 if(files.length){for(const file of files){if(!file.size)throw new AppError('빈 파일은 읽을 수 없습니다.');attach(Buffer.from(await file.arrayBuffer()),file.name);}}
 if(text)sources.push('직접 붙여 넣은 가이드');
 if(url){let page;try{page=await readGuideURL(url);}catch(e){throw new AppError(e instanceof Error?e.message:'링크를 읽을 수 없습니다.',422);}if(fileMime(page.bytes)){attach(page.bytes,'링크에서 받은 가이드');sources[0]=page.url;}else if(page.type.includes('text/html')||page.type.includes('text/plain')){sourceText=htmlText(page.bytes.toString('utf8'));if(sourceText.length<200||sourceText.length>40000)throw new AppError('링크에서 가이드 전체를 읽기 어렵습니다. PDF 또는 캡처를 업로드해 주세요.',422);sources.push(page.url);partial=true;}else throw new AppError('지원하지 않는 링크 형식입니다. PDF 또는 캡처를 업로드해 주세요.',422);}
 await reserveUsage(user.id);return Response.json({guide:await analyzeGuide(sourceText,sources,attachments,partial)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return errorResponse(e);}}
