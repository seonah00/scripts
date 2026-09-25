'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="status-shell"><div className="status-card"><h1>잠시 연결을 확인하고 있어요</h1><p>로그인 또는 저장소 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.</p><button className="auth-submit" onClick={reset}>다시 시도</button><a href="/login">로그인 화면으로</a></div></main>;}
