// LUMA Base API Client: Headers, Session & CSRF Management

let storedCsrfToken: string | null = null;
let storedSessionId: string | null = null;

if (typeof window !== 'undefined') {
  try {
    storedSessionId = localStorage.getItem('luma_session_id');
    storedCsrfToken = localStorage.getItem('luma_csrf_token');
  } catch {}
}

export function setCsrfToken(token: string | null) {
  storedCsrfToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) localStorage.setItem('luma_csrf_token', token);
      else localStorage.removeItem('luma_csrf_token');
    } catch {}
  }
}

export function getCsrfToken(): string | null {
  return storedCsrfToken;
}

export function setSessionId(id: string | null) {
  storedSessionId = id;
  if (typeof window !== 'undefined') {
    try {
      if (id) localStorage.setItem('luma_session_id', id);
      else localStorage.removeItem('luma_session_id');
    } catch {}
  }
}

export function getSessionId(): string | null {
  return storedSessionId;
}

let authCheckPromise: Promise<string | null> | null = null;

export async function ensureCsrfToken(): Promise<string | null> {
  if (storedCsrfToken && storedSessionId) return storedCsrfToken;
  if (!authCheckPromise) {
    const headers: Record<string, string> = {};
    if (storedSessionId) {
      headers['X-Session-ID'] = storedSessionId;
      headers['Authorization'] = `Bearer ${storedSessionId}`;
    }
    authCheckPromise = fetch('/api/auth/me', { headers, credentials: 'include' })
      .then(res => (res.ok ? safeParseJson(res) : null))
      .then(data => {
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
        if (data?.sessionId) setSessionId(data.sessionId);
        return data?.csrfToken || null;
      })
      .catch(() => null)
      .finally(() => {
        authCheckPromise = null;
      });
  }
  return authCheckPromise;
}

export async function safeParseJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      }
      return data as T;
    } catch (e: any) {
      if (!res.ok) {
        throw new Error(e?.message || `Request failed with status ${res.status}`);
      }
      throw e;
    }
  }

  const text = await res.text();
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Your session or security token expired. Please refresh the page.');
    }
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('AI service is temporarily warming up. Please try again in a moment.');
    }
    throw new Error(`Service notice (${res.status}): ${text.slice(0, 100)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Unexpected response format from server.');
  }
}

export async function request(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };

  if (storedSessionId) {
    headers['X-Session-ID'] = storedSessionId;
    if (!headers['Authorization']) {
      headers['Authorization'] = `Bearer ${storedSessionId}`;
    }
  }

  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (!storedCsrfToken && !url.includes('/api/auth/')) {
      await ensureCsrfToken();
    }
    if (storedCsrfToken) {
      headers['X-CSRF-Token'] = storedCsrfToken;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  const respSessionId = response.headers.get('X-Session-ID');
  if (respSessionId) setSessionId(respSessionId);
  const respCsrf = response.headers.get('X-CSRF-Token');
  if (respCsrf) setCsrfToken(respCsrf);

  return response;
}
