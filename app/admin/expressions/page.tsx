import Link from 'next/link';
import {redirect} from 'next/navigation';
import {identity,adminClient} from '@/lib/supabase/server';
import {activeExpressions,expressionListSchema} from '@/lib/expressions';
export const dynamic='force-dynamic';
const statuses:Record<string,string>={pending:'첫 조사 대기',running:'조사 중',ready:'표현 갱신 완료',no_evidence:'이번 조사에서 충분한 근거를 찾지 못함',failed:'갱신 실패 · 다음 날 재시도'};
const date=(v:string|null)=>v?new Date(v).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'아직 없음';
export default async function Expressions(){
 const id=await identity();if(!id)redirect('/login');if(id.member?.status!=='active'||id.member.role!=='admin')redirect('/');
 const {data,error}=await adminClient().from('gv_expression_packs').select('platform,entries,updated_at,last_attempt,next_attempt,status').order('platform');
 return <main style={{maxWidth:1000,margin:'40px auto',padding:24}}><Link href="/admin">← 수강생 관리</Link><h1>플랫폼 표현 자동 갱신</h1><p>7일 간격으로 공개 자료를 조사합니다. 서버가 중지된 동안의 예약은 재시작 후 확인합니다. 시간은 한국 기준입니다.</p><p>AI가 출처와 맥락을 검토한 참고 표현이며, 플랫폼 전체의 인기 순위를 뜻하지 않습니다. 대본 주제와 어울릴 때만 최대 1~2개를 사용합니다. 마지막 갱신 후 28일이 지난 표현은 자동 제외됩니다.</p>{error?<p role="alert">갱신 상태를 불러오지 못했습니다.</p>:data?.map(row=>{const parsed=expressionListSchema.safeParse({entries:row.entries});const entries=parsed.success?parsed.data.entries:[];const active=['beauty','place','other','vlog','daily'].some(c=>activeExpressions(entries,row.updated_at,c).length>0);return <section className="panel" style={{padding:24,marginTop:24}} key={row.platform}><h2>{row.platform==='red'?'샤오홍슈 · 중국어':'틱톡 · 미국 영어'}</h2><p>{statuses[row.status]??'상태 확인 필요'}</p><dl><dt>최근 조사 시도</dt><dd>{date(row.last_attempt)}</dd><dt>최근 표현 등록</dt><dd>{date(row.updated_at)}</dd><dt>다음 조사 예정</dt><dd>{date(row.next_attempt)}</dd></dl><p>{active?`${entries.length}개 참고 표현 · 주제별 선택 적용`:'현재 적용 가능한 표현 없음 · 기본 현지어 지침으로 작성'}</p>{entries.map(e=><article style={{borderTop:'1px solid #ddd',paddingTop:16,marginTop:16}} key={e.phrase}><h3>{e.phrase}</h3><p>{e.meaning}</p><p>사용 맥락: {e.context}</p><p>피할 맥락: {e.avoid||'등록된 추가 제한 없음'}</p><p>{e.categories.join(' · ')} / {e.usage==='spoken'?'말하기용':e.usage==='onscreen'?'화면 문구용':'말하기·화면 문구'}</p><ul>{e.evidence.map(v=><li key={v.url}><a href={v.url} target="_blank" rel="noopener noreferrer">사용 사례 · {v.date}</a><p>{v.excerpt}</p></li>)}</ul></article>)}</section>;})}</main>;
}
