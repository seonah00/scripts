# 독립 서비스 운영 설치

## 권장 운영 구성

GitHub 비공개 저장소 → Railway 웹서비스 → Supabase Auth / Postgres.
소스와 데이터는 운영자 계정에서 관리합니다. 수강생은 웹주소로 방문해 이메일로 가입합니다.
추가 플러그인 설치는 앱 이용 조건이 아닙니다.

GitHub: https://github.com/seonah00/scripts
Supabase: https://khlsksdismvaarvivhxl.supabase.co
2026-09-25 globalviral_student_service 마이그레이션 적용 완료. Railway 서비스는 아직 연결하지 않았습니다.
다른 서비스의 Auth 설정과 회원 목록에 영향을 주지 않도록 새 Supabase 프로젝트를 권장합니다.

## 1. 데이터베이스

지정된 scripts 프로젝트에는 bootstrap 스키마가 이미 적용되어 있으므로 다시 실행하지 않습니다. 다른 새 프로젝트로 이전할 때만 `database/bootstrap.sql`을 한 번 실행합니다.
이 스크립트는 중복 실행용이 아닙니다. 트랜잭션으로 적용하며 이미 동명 테이블이 있으면 롤백됩니다.
`gv_members`, `gv_projects`, `gv_profiles`, `gv_daily_usage`에 RLS와 최소 권한 GRANT를 함께 적용합니다.
사용자 계정은 스키마 적용 이후 생성합니다. 기존 auth.users는 자동으로 등록되지 않습니다.
운영 프로젝트 적용 후 Supabase Security Advisor를 실행하여 배포 환경의 경고도 확인합니다.

## 2. Railway

이 소스를 GitHub 비공개 저장소에 커밋하고 Railway에서 해당 저장소를 연결합니다.
루트 Dockerfile과 railway.json을 사용하며 웹 포트를 Railway의 PORT 환경변수로 받습니다.
Railway에서 도메인을 생성하고, 환경변수를 다음과 같이 설정합니다.

| 변수 | 값 |
| --- | --- |
| APP_URL | 실제 HTTPS 웹주소. 예: https://studio.example.com |
| SUPABASE_URL | 전용 Supabase 프로젝트 URL |
| SUPABASE_PUBLISHABLE_KEY | 같은 프로젝트의 publishable key |
| SUPABASE_SECRET_KEY | 같은 프로젝트의 서버 전용 secret key 또는 service_role key |
| OPENAI_API_KEY | 틱톡 영어 생성·제품/매장 자동 조사용 OpenAI API 키 |
| DEEPSEEK_API_KEY | 샤오홍슈 중국어 생성·부분 수정용 DeepSeek API 키 |
| DEEPSEEK_MODEL | 기본값 deepseek-flash (선택 설정) |
| OPENAI_MODEL | 선택 모델. 기본값 gpt-4.1 |

비밀값은 Railway Variables에 입력하고 GitHub·브라우저·문서에 넣지 않습니다.
이 구현은 Supabase 클라이언트를 서버에서 사용하므로 NEXT_PUBLIC 접두사가 필요 없습니다.
키는 빌드 때 필요하지 않고 실행 때 읽습니다. 환경변수를 변경하면 재배포합니다.
`/api/health`는 프로세스 상태를 확인합니다. 외부 인증/DB/AI 서비스의 연결 성공을 보장하는 지표는 아닙니다.

## 3. Supabase Auth

- Email provider를 활성화하고 Confirm email을 켭니다.
- Site URL을 APP_URL과 같은 실제 HTTPS 주소로 설정합니다.
- Redirect URLs에 `https://실제주소/auth/confirm`과 `https://실제주소/account/password`를 허용합니다.
- 비밀번호 최소 길이를 12자로 설정합니다. 익명 로그인을 사용하지 않습니다.
- 수강생에게 인증 메일을 보내려면 발신 도메인 인증과 운영용 SMTP를 설정합니다.
- Supabase Auth rate limits 및 이메일 발송 한도를 수강생 규모에 맞게 설정합니다.

이 앱은 서버 쿠키 인증을 사용합니다. **아래 이메일 템플릿을 반드시 적용**합니다.
기본 이메일의 fragment 토큰은 서버에서 읽을 수 없습니다.

Confirm signup 이메일 링크:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">이메일 인증하기</a>
```

Reset password 이메일 링크:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">비밀번호 재설정하기</a>
```

인증 링크는 만료되거나 재사용하면 로그인 화면에 안내를 표시합니다.
이메일 링크 확인은 세션 쿠키를 만들고 recovery는 비밀번호 변경 화면으로 이동합니다.
비밀번호 변경 후 전역 로그아웃을 요청하고 다시 로그인하게 합니다.

## 4. 최초 운영자

운영자가 웹서비스에서 먼저 가입하고 이메일 인증을 완료합니다.
그 계정의 UUID를 Supabase Authentication에서 확인한 후 SQL Editor에서 다음을 실행합니다.
이 작업은 최초 관리자 설정이며 수강생 화면에서 관리자 권한을 요청하거나 부여할 수 없습니다.

```sql
update public.gv_members
set role = 'admin', status = 'active'
where id = '실제 운영자 UUID'::uuid
returning id, email, role, status;
```

운영자로 로그인해 상단 `수강생 관리`로 이동합니다.
수강생 이메일을 확인하고 승인하면 작업실을 사용할 수 있습니다.
이용 중지는 다음 서버 요청부터 적용됩니다. 이미 열려 있는 화면의 텍스트까지 원격 삭제하지는 않습니다.
관리자 화면은 학생 계정의 상태만 바꿀 수 있고 관리자 권한 변경 기능은 제공하지 않습니다.

## 5. 운영 연결 검증

테스트 계정 두 개로 실제 이메일 인증 → 로그인 → 승인 대기 → 운영자 승인 → 저장 → 재로그인 후 복구를 확인합니다.
한 계정을 중지하여 저장/API가 차단되고 다른 계정은 계속 이용 가능한지 확인합니다.
비밀번호 재설정 메일을 다른 브라우저에서 열어 새 비밀번호로 로그인되는지 확인합니다.
실제 AI 키 설정 후 조사/생성/부분 수정 각각 한 번씩 확인합니다.
인증 메일 발송·AI 호출은 외부 연결이 필요한 검증으로 아직 수행하지 않았습니다.
DB 백업·요금·도메인·발신메일은 운영자 소유 계정에서 설정합니다.

## 유지보수

GitHub Actions는 타입 검사, RLS 테스트, 빌드, 익명 접근/CSRF HTTP 테스트를 수행합니다.
Supabase 스키마 변경은 별도 검토 후 마이그레이션으로 관리하고 최초 bootstrap을 반복 실행하지 않습니다.
AI 사용량 예약은 원자적이며 실패한 AI 요청도 한도에 포함됩니다. 무제한 재시도로 비용이 발생하는 것을 막기 위한 설정입니다.

## 브이로그·일상 및 현지화 업데이트

기존 JSON 프로젝트는 새 입력 필드의 기본값을 적용해 열 수 있습니다. DB 스키마 변경은 필요 없습니다.
브이로그·일상은 외부 자동 조사를 하지 않고 본인이 입력한 경험/계획을 확인한 후 생성합니다.
샤오홍슈 제목·훅·장면·본문과 한국어 의미를 DeepSeek가 함께 작성하며, 부분 수정에도 같은 모델을 사용합니다.
DeepSeek 키가 없으면 샤오홍슈 AI 생성 버튼이 비활성화됩니다. 다른 모델로 자동 대체하지 않습니다.
틱톡은 기존 OpenAI 키를 유지합니다. 두 언어 모두 억지 유행어, 검증되지 않은 트렌드 주장, 경험 날조를 금지하는 작성 지침을 적용합니다.
실시간 인기 표현 수집 기능은 포함하지 않습니다. 실제 현지어 품질과 계정의 말투는 키 연결 후 생성 결과로 확인합니다.
DeepSeek 요청은 사용자 확인 정보·기획 입력·크리에이터 프로필을 포함하며 서버 비밀키로 전송합니다.
공식 API: https://api-docs.deepseek.com/api/create-chat-completion/
