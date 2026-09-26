// Never surface provider response bodies, credentials, or user input.
export function openAIError(status:number,body:unknown){
 const error=body&&typeof body==='object'&&'error'in body?(body as {error:unknown}).error:null;
 const e=error&&typeof error==='object'?error as Record<string,unknown>:{};
 const knownCodes=new Set(['invalid_api_key','insufficient_quota','rate_limit_exceeded','model_not_found','invalid_request_error','unsupported_parameter','unsupported_value','invalid_value','missing_required_parameter','permission_denied','server_error']);
 const code=typeof e.code==='string'&&knownCodes.has(e.code)?e.code:typeof e.type==='string'&&knownCodes.has(e.type)?e.type:'unclassified';
 const params=new Set(['model','tools','tools[0].type','tool_choice','text.format','text.format.type','max_output_tokens','input','instructions','store']);
 const param=typeof e.param==='string'&&params.has(e.param)?e.param:'';
 const message=typeof e.message==='string'?e.message:'';
 let reason='OpenAI 요청을 처리하지 못했습니다.';
 if(status===401)reason='OpenAI API 인증이 거부되었습니다.';
 else if(status===429)reason=code==='insufficient_quota'?'OpenAI API 크레딧 또는 결제 한도를 확인해 주세요.':'OpenAI 요청 한도에 도달했습니다.';
 else if(status===404)reason='설정한 OpenAI 모델 또는 API 경로를 찾지 못했습니다.';
 else if(status===403)reason='OpenAI API 접근 권한이 거부되었습니다.';
 else if(status===400){
  reason='OpenAI가 요청 형식을 거부했습니다.';
  if(/verif/i.test(message)&&/organi[sz]ation/i.test(message))reason='OpenAI 조직 인증이 필요한 요청입니다.';
  else if(/json/i.test(message)&&/input|message|instruction/i.test(message))reason='JSON 출력 요청에 필요한 JSON 지시를 확인해야 합니다.';
  else if(/not supported|unsupported|does not support/i.test(message))reason='설정 모델에서 지원하지 않는 요청 옵션이 있습니다.';
 }
 return `${reason} (HTTP ${status} · ${code}${param?' · '+param:''})`;
}
