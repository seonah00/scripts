# 독립 서비스 검증

2026-09-25 구현 버전.

## 통과

- Next.js 프로덕션 빌드 및 TypeScript 검사
- 로컬 PostgreSQL 엔진(PGlite)에서 실제 bootstrap SQL 실행
- 신규 가입 회원은 student/pending으로 생성
- 승인 전 프로젝트 생성 차단
- 본인 프로젝트·프로필만 조회 및 저장
- 타인 UUID로 저장하거나 소유자를 변경하는 요청 차단
- 직접 DB API로 수강 권한/관리자 역할 변경 불가
- 중지된 수강생 데이터 읽기·쓰기 차단
- 비회원 테이블 접근 차단
- AI 사용량 함수는 서버 권한으로만 호출, 한국시간 1일 30회 제한
- 프로덕션 HTTP 서버에서 로그인 HTML 응답
- 비회원의 작업실/관리자/비밀번호 변경 경로는 로그인으로 이동
- 임의 ChatGPT 인증 헤더로 로그인 위장 불가
- 다른 Origin의 로그인·로그아웃 요청 거부
- 인증 미설정 시 503 안내로 실패 처리

## 미검증 및 남은 운영 작업

- 실제 Supabase Auth/메일 발송/세션 갱신/비밀번호 재설정 연동
- 지정된 Supabase 프로젝트에 스키마 적용 후 RLS·권한 및 Security Advisor 확인 (별도 연결 결과 참조)
- 실제 Railway Docker 빌드·배포 및 HTTPS 도메인
- 실제 OpenAI 호출
- 새 로그인·관리자 화면의 브라우저 시각/모바일 조작 테스트

기존 스튜디오의 이전 브라우저 검증은 독립 인증 연동 검증을 대신하지 않습니다.
인증·DB·SMTP 연결 전에는 수강생에게 서비스 오픈을 안내하면 안 됩니다.

## 원격 연결 결과 (2026-09-25)

지정된 Supabase scripts 프로젝트에 globalviral_student_service 마이그레이션을 적용했습니다.
4개 테이블의 RLS 활성화, 7개 접근 정책, 학생 역할의 회원 권한 변경 및 사용량 예약 함수 실행 불가를 확인했습니다.
Security Advisor의 오류·경고는 없으며, 사용량 테이블에 직접 접근 정책이 없다는 INFO 한 건이 있습니다.
이는 서버 전용 테이블의 의도적인 기본 거부 설정입니다. 학생 역할에는 테이블 권한도 없습니다.
참고: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## 2026-09-26 추가 검증

브이로그·일상 스키마/저장 형식 및 기존 프로젝트 기본값 호환을 확인했습니다.
DeepSeek 요청 형식, 키 미설정 시 호출 차단, 미완성·빈 응답 거부, 사용량 오류 처리를 모의 응답으로 확인했습니다.
실제 DeepSeek 호출 및 중국어 품질 평가는 운영 키 연결 전이므로 미검증입니다.


## Xiaohongshu editorial strategy update

Chinese generation and block rewriting now receive explicit relevance-based keyword, reader-intent, differentiated hook, useful takeaway and contextual claim-review instructions. No live keyword volume/trend feed or ranking guarantee is provided. Personal stories must not be forced into shopping/checklist content. The visible expression checker remains six deterministic pattern categories, not comprehensive moderation or legal clearance. Prompt changes require qualitative live-output evaluation; type checks do not establish audience performance.


## 0.3.0 구현 및 검증 범위 (2026-09-26)

- 여러 항목 2~4개 소개 / 비교 / 루틴. 제품별 URL, 변형/지점, 실제 후기, 관계를 저장합니다.
- 항목별 조사 결과에 itemId를 서버에서 부여합니다. 확인되지 않은 사실, 삭제된 항목의 사실, 미사용 항목의 경험을 생성에서 제외합니다.
- 항목별 확인 사실이 없으면 생성을 차단합니다. 사용 후기 입력은 확인 전 경험 카드로 옮깁니다.
- 발행 제목/썸네일/한국어 의미/관련 키워드 분리. 기존 프로젝트에 기본값 적용.
- 생성 후 같은 언어 제공자로 근거/번역을 다시 검토합니다. 전체 검수·수정과 되돌리기를 제공합니다. 단어 검사와 달리 AI 검수는 비용과 시간이 추가되며 완전한 사실 검증이 아닙니다.
- 검수 결과의 장면 ID·수·라벨 변화와 썸네일 누락을 거부합니다. 수정 오류 시 현재 결과는 유지됩니다.
- 규칙 검사는 기존 6개 유형이며 공식 금지어 판정이 아닙니다.
- 실제 DeepSeek 생성과 관리자 로그인은 이전 운영 테스트에서 확인했습니다. 기존 생성에서 추가 주장/한국어 혼입/해설 혼입을 발견했습니다. 이번 검수 변경은 그 문제를 줄이기 위한 것으로, 새 버전의 실제 AI 품질 검증은 별도 필요합니다.
- 일반 수강생 승인·복원·비밀번호 재설정의 운영 E2E, 실제 OpenAI 영어/조사 결과 및 모바일 검증은 아직 별도 확인이 필요합니다.


### 운영 0.3.0 확인
- Railway health version 0.3.0 및 새 입력 화면 확인.
- 가상 A/B 사례로 한 항목의 근거가 없으면 다음 단계 차단 확인. DeepSeek 생성+두 번째 검수 결과 반환 확인, 미사용 B의 사용감은 생성하지 않음.
- 별도 썸네일과 한국어 의미, 검수 메모 표시 확인. 관리자 계정에서 검증용 프로젝트 1개 저장 후 페이지 새로고침 및 재열기, 썸네일 복원 확인.
- 실제 글로우 제품 자동 조사에서 사용 가능한 사실을 얻지 못함. 조사 상태/실패 메시지를 지속 표시하도록 보완. 외부 원문 접근과 결과 정확성을 보장하지 않음.
