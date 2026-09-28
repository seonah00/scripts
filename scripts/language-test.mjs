import {eligibleExpressions,activeExpressions} from '../lib/expressions.ts';
import {structuredFormat} from '../lib/openai-format.ts';
import {openAIError} from '../lib/provider-error.ts';
import assert from 'node:assert/strict';
import {deepseekJSON,languageInstructions} from '../lib/language.ts';
import {briefSchema,emptyBrief,projectSchema,getConcepts,eligibleFacts,validateItems,factSchema,resultSchema,makeDemo,validateReviewedResult} from '../lib/studio.ts';
const legacy={...emptyBrief,name:'기존 제품'};delete legacy.scenes;delete legacy.mood;delete legacy.shootingStage;
const old=briefSchema.parse(legacy);assert.equal(old.scenes,'');assert.equal(old.shootingStage,'planned');
for(const category of ['vlog','daily']){
 const brief=briefSchema.parse({...emptyBrief,name:'퇴근 후의 하루',category,experience:'used',notes:'집에서 파스타를 만들었다',scenes:'요리하는 손',shootingStage:'filmed'});
 const project=projectSchema.parse({id:'11111111-1111-4111-8111-111111111111',brief,facts:[],result:null,concept:0,demo:false,updatedAt:new Date().toISOString()});
 assert.equal(project.brief.category,category);assert.notEqual(getConcepts(category)[0].title,getConcepts('beauty')[0].title);
}
const fetchOriginal=globalThis.fetch;let calls=0;
try{
 globalThis.fetch=async (url,options)=>{calls++;assert.equal(url,'https://api.deepseek.com/chat/completions');const body=JSON.parse(options.body);assert.equal(body.response_format.type,'json_object');assert.match(body.messages[0].content,/JSON/);assert.equal(body.messages[1].content,JSON.stringify({story:'퇴근 후 파스타'}));return Response.json({choices:[{finish_reason:'stop',message:{content:'{"title":"下班后的晚饭"}'}}]});};
 await assert.rejects(deepseekJSON('test',{},{}),e=>e.status===503);assert.equal(calls,0);
 const result=await deepseekJSON(languageInstructions('red'),{story:'퇴근 후 파스타'},{key:'test-only-not-a-real-key'});assert.equal(JSON.parse(result.text).title,'下班后的晚饭');
 globalThis.fetch=async()=>Response.json({choices:[{finish_reason:'length',message:{content:'{"title":'}}]});
 await assert.rejects(deepseekJSON('JSON',{}, {key:'test'}),e=>e.status===502);
 globalThis.fetch=async()=>Response.json({choices:[{finish_reason:'stop',message:{content:''}}]});
 await assert.rejects(deepseekJSON('JSON',{}, {key:'test'}),e=>e.status===502);
 globalThis.fetch=async()=>new Response('',{status:429});await assert.rejects(deepseekJSON('JSON',{}, {key:'test'}),e=>e.status===429);
}finally{globalThis.fetch=fetchOriginal;}
console.log('PASS: legacy project defaults, vlog/daily roundtrip, DeepSeek JSON request, missing-key isolation, truncated/empty output and rate-limit handling. No external AI calls.');

const items=[{id:'a',name:'A',url:'https://example.com/a',experience:'used',review:'촉촉했다',variant:'1호'},{id:'b',name:'B',url:'',experience:'none',review:'미사용',variant:'2호'}];
const multi=briefSchema.parse({...emptyBrief,name:'두 제품',mode:'comparison',items});validateItems(multi);
const f=(itemId,kind,confirmed=true)=>factSchema.parse({id:itemId+kind,itemId,text:'확인 정보',source:'시험 자료',kind,confirmed,checkedAt:new Date().toISOString()});
assert.deepEqual(eligibleFacts(multi,[f('a','experience'),f('b','experience'),f('b','official'),f('removed','official'),f('a','manual',false)]).map(x=>x.id),['aexperience','bofficial']);
assert.throws(()=>validateItems({...multi,items:[multi.items[0]]}));
assert.throws(()=>validateItems({...multi,items:[multi.items[0],multi.items[0]]}));
assert.equal(briefSchema.safeParse({...multi,items:[{...items[0],url:'javascript:alert(1)'},items[1]]}).success,false);
const legacyResult=makeDemo('red','cards',0);delete legacyResult.thumbnail;delete legacyResult.reviewNotes;
assert.equal(resultSchema.parse(legacyResult).thumbnail,'');
const round=projectSchema.parse({id:'11111111-1111-4111-8111-111111111111',brief:multi,facts:[f('a','experience')],result:makeDemo('red','cards',0),concept:0,demo:false,updatedAt:new Date().toISOString()});assert.equal(round.facts[0].itemId,'a');
console.log('PASS: multi-item fact isolation, unexperienced review exclusion, invalid links, duplicate IDs, legacy result defaults and project roundtrip.');

const original=makeDemo('red','cards',0);const corrected={...original,thumbnail:'封面',thumbnailKorean:'표지'};
assert.equal(validateReviewedResult(original,corrected),corrected);
assert.throws(()=>validateReviewedResult(original,{...corrected,blocks:corrected.blocks.slice(1)}));
assert.throws(()=>validateReviewedResult(original,{...corrected,thumbnail:''}));
assert.throws(()=>validateReviewedResult(original,{...corrected,blocks:corrected.blocks.map((b,i)=>i?b:{...b,id:'changed'})}));
console.log('PASS: editorial correction retains block identity/count and requires separate thumbnail translation.');

const providerErr=openAIError(400,{error:{type:'invalid_request_error',param:'text.format',message:'private-user-text secret-key unsupported option'}});assert.match(providerErr,/HTTP 400/);assert.match(providerErr,/text.format/);assert.doesNotMatch(providerErr,/private-user-text|secret-key/);assert.doesNotMatch(openAIError(500,{error:{code:'secret-key',param:'private-user-text'}}),/secret-key|private-user-text/);console.log('PASS: provider diagnostics disclose only status and allowlisted metadata.');

const format=structuredFormat(resultSchema);
assert.equal(format.type,'json_schema');
assert.equal(format.strict,true);
function checkObjectSchema(node){
 if(!node||typeof node!=='object')return;
 assert.equal('default' in node,false);
 if(node.type==='object'){
  assert.equal(node.additionalProperties,false);
  assert.deepEqual([...node.required].sort(),Object.keys(node.properties).sort());
 }
 Object.values(node).forEach(checkObjectSchema);
}
checkObjectSchema(format.schema);
assert.ok(format.schema.required.includes('thumbnail'));
assert.equal(format.schema.properties.blocks.maxItems,12);
console.log('PASS: strict OpenAI output requires all fields including legacy-default fields and rejects extra keys at every object level.');

const expressionNow=Date.parse('2026-09-27T00:00:00Z');
const expressionEntry={phrase:'test phrase',meaning:'검증용',context:'테스트',avoid:'',categories:['daily'],usage:'spoken',evidence:[{url:'https://www.tiktok.com/@example/video/123',date:'2026-09-20',excerpt:'test phrase'},{url:'https://example.com/recent',date:'2026-09-21',excerpt:'test phrase'}]};
const expressionCitations=expressionEntry.evidence.map(e=>e.url);
assert.equal(eligibleExpressions({entries:[expressionEntry]},'tiktok',expressionCitations,expressionNow).length,1);
assert.equal(eligibleExpressions({entries:[expressionEntry]},'red',expressionCitations,expressionNow).length,0);
assert.equal(eligibleExpressions({entries:[expressionEntry]},'tiktok',expressionCitations.slice(0,1),expressionNow).length,0);
for(const date of ['2025-01-01','2026-10-01','2026-02-30'])assert.equal(eligibleExpressions({entries:[{...expressionEntry,evidence:expressionEntry.evidence.map(e=>({...e,date}))}]},'tiktok',expressionCitations,expressionNow).length,0);
assert.equal(eligibleExpressions({entries:[{...expressionEntry,evidence:[expressionEntry.evidence[0],expressionEntry.evidence[0]]}]},'tiktok',expressionCitations,expressionNow).length,0);
assert.equal(activeExpressions([expressionEntry],'2026-09-20','daily',expressionNow).length,1);
assert.equal(activeExpressions([expressionEntry],'2026-09-20','beauty',expressionNow).length,0);
assert.equal(activeExpressions([expressionEntry],'2026-08-01','daily',expressionNow).length,0);
console.log('PASS: expression source citation matching, platform isolation, dates, duplicate evidence, topic selection and expiry.');

// Regression: DeepSeek JSON mode can return valid JSON with the wrong shape.
try{
 let attempts=0;
 const valid=makeDemo('red','cards',0);
 globalThis.fetch=async(_url,options)=>{
  attempts++;const body=JSON.parse(options.body);
  assert.match(body.messages[0].content,/JSON Schema/);
  if(attempts===2){const repair=JSON.parse(body.messages[1].content);assert.ok(repair.validationIssues.length);assert.deepEqual(repair.originalInput,{story:'검증용'});}
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(attempts===1?{result:valid}:valid)}}]});
 };
 const repaired=await deepseekJSON('test',{story:'검증용'},{key:'test'},resultSchema);
 assert.deepEqual(JSON.parse(repaired.text),resultSchema.parse(valid));assert.equal(attempts,2);
 attempts=0;
 globalThis.fetch=async()=>{attempts++;return Response.json({choices:[{finish_reason:'stop',message:{content:'{"blocks":[]}'}}]});};
 await assert.rejects(deepseekJSON('test',{}, {key:'test'},resultSchema),e=>e.status===502&&/자동 교정/.test(e.message));assert.equal(attempts,2);
 attempts=0;
 globalThis.fetch=async()=>{attempts++;return new Response('',{status:401});};
 await assert.rejects(deepseekJSON('test',{}, {key:'test'},resultSchema),e=>e.status===502);assert.equal(attempts,1);
}finally{globalThis.fetch=fetchOriginal;}
console.log('PASS: malformed Chinese output repaired once; persistent invalid output rejected; authentication failures not retried.');
