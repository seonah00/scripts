import type {Brief} from './studio';
export function languageInstructions(platform:Brief['platform']){
 return platform==='red'
 ? `Write for young adult Xiaohongshu readers in natural contemporary Simplified Chinese. Transcreate the meaning, never translate Korean syntax literally. Use a peer-to-peer, specific, relaxed voice, readable short lines and understated emotion appropriate to the creator's tone. Distinguish conversational spoken voiceover from concise on-screen copy and a readable note caption. Avoid stiff advertising prose, exaggerated claims, repetitive 宝子们/家人们/绝绝子/谁懂, forced memes, excessive emojis or gender assumptions. Use slang only where it fits the context and remains understandable; do not claim any expression is currently trending or guaranteed to perform. Preserve facts, uncertainty, dates, sponsorship and the intensity of feelings. Every Korean meaning must accurately explain the FINAL Chinese text.`
 : `Write for a US TikTok audience in natural contemporary American English. Transcreate meaning instead of literal Korean syntax. Use contractions, short spoken clauses, concrete hooks and believable conversational pacing that sounds natural read aloud. Match the creator's tone; distinguish spoken voiceover from on-screen text and caption. Avoid corporate copy, textbook transitions, exaggerated hooks, forced slang, indiscriminate POV/GRWM, stereotypes and imitating a dialect the creator did not request. Use familiar TikTok framing only if the footage/story genuinely fits it. Never claim a phrase is trending now without evidence. Preserve facts, uncertainty, sponsorship and emotional intensity. Every Korean meaning must accurately explain the FINAL English text.`;
}
export class LanguageError extends Error {status:number;constructor(message:string,status=502){super(message);this.status=status;}}
export async function deepseekJSON(instructions:string,input:unknown,config:{key?:string;model?:string}){
 if(!config.key)throw new LanguageError('샤오홍슈 중국어 생성에 필요한 DeepSeek 연결이 아직 준비되지 않았습니다.',503);
 let response:Response;
 try{response=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${config.key}`,'Content-Type':'application/json'},body:JSON.stringify({model:config.model||'deepseek-flash',messages:[{role:'system',content:instructions+'\nReturn a valid JSON object only.'},{role:'user',content:JSON.stringify(input)}],response_format:{type:'json_object'},thinking:{type:'disabled'},stream:false,max_tokens:6500}),signal:AbortSignal.timeout(75000)});}catch{throw new LanguageError('중국어 생성 응답이 지연되고 있습니다. 입력은 유지됩니다. 다시 시도해 주세요.',504);}
 if(!response.ok)throw new LanguageError(response.status===429?'DeepSeek 요청 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.':'DeepSeek 연결을 확인하지 못했습니다. 운영자의 API 키·잔액·모델 설정을 확인해 주세요.',response.status===429?429:502);
 const data=await response.json() as {choices?:{finish_reason?:string;message?:{content?:string}}[]};
 const choice=data.choices?.[0];
 if(choice?.finish_reason!=='stop'||!choice.message?.content?.trim())throw new LanguageError('중국어 생성 결과가 완성되지 않았습니다. 다시 시도해 주세요.');
 return {text:choice.message.content,citations:[]};
}
