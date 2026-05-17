/**
 * 응답 body를 안전하게 JSON으로 파싱합니다.
 * 빈 body, 파싱 실패, HTML 에러 페이지 모두 빈 객체 {}를 반환합니다.
 */
export async function safeJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text().catch(() => "");
  if (!text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

/**
 * fetch + 에러 처리를 한 번에 합니다.
 * 성공이면 { ok: true, data } , 실패면 { ok: false, error: string } 반환.
 */
export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  options?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, options);
    const data = await safeJson<T & { error?: string }>(res);
    if (!res.ok) {
      return { ok: false, error: (data as { error?: string }).error ?? `오류가 발생했습니다. (${res.status})` };
    }
    return { ok: true, data: data as T };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "네트워크 오류가 발생했습니다.";
    return { ok: false, error: msg };
  }
}
