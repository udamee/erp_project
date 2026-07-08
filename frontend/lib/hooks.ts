// 공통 클라이언트 훅 모음 (React 19 권장 패턴 기준)
import { DependencyList, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { type AuthUser } from "@/lib/api-client";

/**
 * 비동기 데이터 로딩 훅.
 * - 경쟁 상태(race condition) 방지: 토큰으로 "마지막 요청만 반영"한다.
 *   (react.dev "You Might Not Need an Effect"의 ignore 플래그와 동일 목적)
 * - effect 본문에서 동기 setState를 호출하지 않아 set-state-in-effect 경고가 없다.
 *   (로딩 표시는 초기값 true + .finally, 수동 갱신은 이벤트 핸들러의 reload로 처리)
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tokenRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  // 렌더 중 ref를 건드리지 않도록 커밋 이후 최신 fetcher로 동기화한다.
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(() => {
    const token = ++tokenRef.current;
    fetcherRef.current()
      .then((d) => {
        if (token === tokenRef.current) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (token === tokenRef.current) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (token === tokenRef.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    run();
    // deps가 바뀔 때마다 재조회 (run은 안정적이라 의존성에서 제외)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // 이벤트 핸들러(검색·새로고침 등)에서 호출 — effect 밖이라 setLoading 동기 호출이 안전하다.
  const reload = useCallback(() => {
    setLoading(true);
    run();
  }, [run]);

  return { data, loading, error, reload };
}

// ===== 로그인 사용자 (SSR 안전 + 렌더 순수성 유지) =====

// useSyncExternalStore의 getSnapshot은 참조가 안정적이어야 하므로 파싱 결과를 캐시한다.
let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function getUserSnapshot(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("authUser");
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
  }
  return cachedUser;
}

function subscribeUser(callback: () => void) {
  // 다른 탭에서의 로그아웃 등 storage 변경에 반응
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/**
 * 로그인 사용자 정보를 렌더 중 직접 localStorage를 읽지 않고(순수성 유지),
 * SSR/CSR 스냅샷을 분리해 하이드레이션 불일치 없이 제공한다.
 */
export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(subscribeUser, getUserSnapshot, () => null);
}

// 역할 단축 헬퍼
export function useRole(): string {
  return useAuthUser()?.role ?? "";
}
