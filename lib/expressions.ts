import {z} from 'zod';
export const expressionSchema=z.object({phrase:z.string().min(1).max(100),meaning:z.string().min(1).max(400),context:z.string().min(1).max(400),avoid:z.string().max(400),categories:z.array(z.enum(['beauty','place','other','vlog','daily'])).min(1).max(5),usage:z.enum(['spoken','onscreen','both']),evidence:z.array(z.object({url:z.string().url(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),excerpt:z.string().min(1).max(180)})).min(2).max(3)});
export type Expression=z.infer<typeof expressionSchema>;
export const expressionListSchema=z.object({entries:z.array(expressionSchema).max(8)});
export function sourceURL(raw:string){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password)return '';u.hash='';for(const key of [...u.searchParams.keys()])if(key.startsWith('utm_'))u.searchParams.delete(key);return u.toString();}catch{return '';}}
function platformPost(url:string,platform:'red'|'tiktok'){const u=new URL(url);return platform==='red'?/(^|\.)xiaohongshu\.com$/.test(u.hostname)&&/^\/(explore|discovery\/item)\//.test(u.pathname):/(^|\.)tiktok\.com$/.test(u.hostname)&&/^\/@[^/]+\/video\/\d+/.test(u.pathname);}
export function eligibleExpressions(input:unknown,platform:'red'|'tiktok',citations:string[],now=Date.now()):Expression[]{
 const parsed=expressionListSchema.safeParse(input);if(!parsed.success)return [];
 const allowed=new Set(citations.map(sourceURL).filter(Boolean));const seen=new Set<string>();
 return parsed.data.entries.filter(e=>{
  const phrase=e.phrase.trim().toLowerCase();if(seen.has(phrase))return false;
  const evidence=e.evidence.filter(v=>{const url=sourceURL(v.url),date=Date.parse(v.date+'T00:00:00Z');return url&&allowed.has(url)&&Number.isFinite(date)&&new Date(date).toISOString().slice(0,10)===v.date&&date<=now&&date>=now-60*86400000&&v.excerpt.toLowerCase().includes(phrase);});
  if(new Set(evidence.map(v=>sourceURL(v.url))).size<2||!evidence.some(v=>platformPost(v.url,platform)))return false;
  e.evidence=evidence;seen.add(phrase);return true;
 });
}
export function activeExpressions(entries:unknown,updatedAt:string|null,category:string,now=Date.now()):Expression[]{
 if(!updatedAt||!Number.isFinite(Date.parse(updatedAt))||Date.parse(updatedAt)>now||now-Date.parse(updatedAt)>28*86400000)return [];
 const parsed=z.array(expressionSchema).max(8).safeParse(entries);return parsed.success?parsed.data.filter(e=>e.categories.includes(category as Expression['categories'][number])).slice(0,4):[];
}
