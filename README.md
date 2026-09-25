# GlobalViral Studio — 독립 수강생 서비스

Next.js 16 / React 19 / Supabase Auth + Postgres / Railway Docker 배포용 소스입니다.
ChatGPT 로그인이나 Cloudflare 실행 환경에 의존하지 않습니다.

## 현재 상태

코드 구현, 프로덕션 빌드, 데이터 접근 규칙 및 HTTP 테스트를 완료했습니다.
**Supabase 스키마 적용 완료. Railway 배포와 인증 이메일·OpenAI 운영 연결은 아직 남아 있습니다.**
사용자가 지정한 seonah00/scripts 저장소와 Supabase scripts 프로젝트를 사용합니다.

## 기능

- 이메일 가입, 이메일 인증, 로그인, 로그아웃, 비밀번호 재설정·변경
- 수강생 가입 후 승인 대기, 운영자 승인 및 이용 중지
- 수강생별 프로젝트·프로필 저장 및 데이터베이스 RLS 보호
- 제품·매장·브이로그·일상 콘텐츠 기획, 확인한 정보 기반 생성, 직접 편집
- 샤오홍슈 중국어: DeepSeek로 현지화; 틱톡: OpenAI로 미국식 구어체 생성
- 촬영 전/완료·보유 장면·분위기 입력, 개인 경험과 촬영 제안 구분
- 추가 기능은 표현 검토만 유지 (CTA·SRT·PDF/Notion 내보내기·트렌드 레이더 제외)
- 사용자별 한국시간 하루 30회 AI 요청 제한; 서버에서만 API 키 사용

## 실행

Node.js 22.13 이상, pnpm 11.19.0을 사용합니다.

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm dev
```

로그인은 Supabase 연결이 있어야 작동합니다. 미설정 상태에서는 준비 중 안내를 표시하고 보호된 기능은 닫힙니다.

```sh
pnpm typecheck
pnpm test:security
pnpm build
pnpm test:http
```

운영 설치 순서와 이메일 템플릿은 `docs/DEPLOYMENT.md`, 검증 범위는 `docs/VERIFICATION.md`에 있습니다.
`database/bootstrap.sql`은 새 전용 Supabase 프로젝트에 적용할 최초 스키마입니다.
원본 Cloudflare 프로젝트와 별도로 전환한 소스입니다. 이전 프로젝트 데이터 자동 이관은 포함하지 않습니다.
