let currentAccessToken: string | null = localStorage.getItem('access_token');

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

let rawBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/$/, '') : '';
let API_BASE = rawBase.endsWith('/api') ? rawBase.slice(0, -4) : rawBase;

// Auto-upgrade http to https if current page is served over https to prevent Mixed Content errors
if (typeof window !== 'undefined' && window.location.protocol === 'https:' && API_BASE.startsWith('http://')) {
  API_BASE = API_BASE.replace(/^http:\/\//, 'https://');
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.data?.accessToken || null;
        setAccessToken(newToken);
        return newToken;
      }
      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Includes httpOnly cookies (for refresh token)
  };

  let response = await fetch(url, config);

  // If 401 Unauthorized, attempt token refresh automatically once (only if user was previously authenticated)
  if (response.status === 401 && currentAccessToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const newToken = await refreshTokens();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...config, headers });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    apiFetch<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
};
