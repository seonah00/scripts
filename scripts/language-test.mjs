import assert from 'node:assert/strict';
import {deepseekJSON,languageInstructions} from '../lib/language.ts';
import {briefSchema,emptyBrief,projectSchema,getConcepts} from '../lib/studio.ts';
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
