/**
 * Base API Client (Next.js 14)
 * - Centralizes base URL, headers, error handling
 * - Supports typed responses and bodies
 * - Cookie-based auth via credentials: 'include'
 * - Optional bearer token support (transitional, Phase 4 will deprecate)
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiClientOptions {
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions<TBody = unknown> {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  body?: TBody;
  signal?: AbortSignal;
  noThrow?: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  userFriendlyMessage?: string;
  validationErrors?: unknown[];
  timestamp?: string;
  path?: string;
}

export class ApiError extends Error {
  status: number;
  data?: ApiErrorResponse | unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function buildQueryString(query?: Record<string, string | number | boolean | undefined>) {
  if (!query) return '';
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return params ? `?${params}` : '';
}

export interface UserJwt {
  sub: string;
  email: string;
  name?: string;
  role?: string;
  roles?: string[];
  tenantId: string;
  iat?: number;
  exp?: number;
}

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  constructor(opts: ApiClientOptions = {}) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.baseUrl = opts.baseUrl || apiUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...opts.defaultHeaders,
    };
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (token) this.authToken = token;
    } catch {}
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('authToken', token);
      } catch {}
    }
  }

  clearAuthToken(): void {
    this.authToken = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
      } catch {}
    }
  }

  parseToken(): UserJwt | null {
    if (!this.authToken) return null;
    try {
      const base64Url = this.authToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private buildHeaders(extra?: Record<string, string>): Record<string, string> {
    // Reload token before building headers to ensure we have the latest
    this.loadAuthToken();
    const headers = { ...this.defaultHeaders, ...(extra || {}) };
    if (this.authToken) headers['Authorization'] = `Bearer ${this.authToken}`;
    return headers;
  }

  async request<TResponse = unknown, TBody = unknown>(
    method: HttpMethod,
    path: string,
    options: RequestOptions<TBody> = {}
  ): Promise<TResponse> {
    const url = `${this.baseUrl}${path}${buildQueryString(options.query)}`;
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers = this.buildHeaders(options.headers);
    if (isFormData && headers['Content-Type']) {
      // Let the browser set multipart boundaries
      delete headers['Content-Type'];
    }

    const init: RequestInit = {
      method,
      headers,
      credentials: 'include',
      signal: options.signal,
    };
    if (options.body !== undefined && method !== 'GET') {
      if (isFormData) {
        init.body = options.body as any;
      } else {
        init.body = headers['Content-Type']?.includes('application/json')
          ? JSON.stringify(options.body)
          : (options.body as any);
      }
    }

    const res = await fetch(url, init);
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

    if (!res.ok) {
      if (res.status === 401) this.clearAuthToken();
      const message = (payload && (payload.message || (payload as any)?.userFriendlyMessage)) || res.statusText || 'Request failed';
      if (options.noThrow) return payload as TResponse;
      throw new ApiError(message, res.status, payload);
    }

    return (payload as unknown) as TResponse;
  }

  get<TResponse = unknown>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('GET', path, options);
  }

  post<TResponse = unknown, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'body'>): Promise<TResponse> {
    return this.request<TResponse, TBody>('POST', path, { ...(options || {}), body });
  }

  put<TResponse = unknown, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'body'>): Promise<TResponse> {
    return this.request<TResponse, TBody>('PUT', path, { ...(options || {}), body });
  }

  patch<TResponse = unknown, TBody = unknown>(path: string, body?: TBody, options?: Omit<RequestOptions<TBody>, 'body'>): Promise<TResponse> {
    return this.request<TResponse, TBody>('PATCH', path, { ...(options || {}), body });
  }

  delete<TResponse = unknown>(path: string, options?: RequestOptions): Promise<TResponse> {
    return this.request<TResponse>('DELETE', path, options);
  }
}

export const apiClient = new ApiClient();
