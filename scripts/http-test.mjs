import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3199';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3199'],{env:{...process.env,APP_URL:origin,SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:'pipe'});
let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
try{
 for(let i=0;i<80;i++){try{if((await fetch(origin+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 let r=await fetch(origin+'/login');assert.equal(r.status,200);assert.match(await r.text(),/다시 만나 반가워요/);
 for(const path of ['/','/pending','/admin','/account/password']){r=await fetch(origin+path,{redirect:'manual'});assert.equal(r.status,307);assert.equal(r.headers.get('location'),'/login');}
 r=await fetch(origin+'/api/studio',{headers:{'oai-authenticated-user-id':'fake-owner','oai-authenticated-user-email':'fake@example.test'}});assert.equal(r.status,401);
 r=await fetch(origin+'/api/admin');assert.equal(r.status,401);
 r=await fetch(origin+'/api/auth',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({action:'login',email:'a@example.test',password:'invalid'})});assert.equal(r.status,403);
 r=await fetch(origin+'/logout',{method:'POST',headers:{Origin:'https://attacker.example'},redirect:'manual'});assert.equal(r.status,403);
 r=await fetch(origin+'/api/auth',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({action:'login',email:'a@example.test',password:'invalid'})});assert.equal(r.status,503);
 console.log('PASS: production login render, protected routes, anonymous/forged-header rejection, cross-origin rejection, explicit unconfigured auth state.');
} catch(e){console.error(logs);throw e;}finally{server.kill('SIGTERM');}
