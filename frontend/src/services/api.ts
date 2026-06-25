const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string> | null;
}

function normalizeErrorMessage(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload
      .map((item) => normalizeErrorMessage(item))
      .filter(Boolean)
      .join(', ');
  }

  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;

    if (typeof data.detail === 'string') {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg?: unknown }).msg ?? '');
          }
          return normalizeErrorMessage(item);
        })
        .filter(Boolean)
        .join(', ');
    }

    if (typeof data.message === 'string') {
      return data.message;
    }

    if (typeof data.error === 'string') {
      return data.error;
    }
  }

  return '';
}

function extractFieldErrors(payload: unknown): Record<string, string> | null {
  if (!payload || typeof payload !== 'object') return null;

  const data = payload as Record<string, unknown>;

  // Pydantic/ FastAPI style errors: { detail: [ { loc: ['body','cpf'], msg: '...' }, ... ] }
  if (Array.isArray(data.detail)) {
    const result: Record<string, string> = {};

    for (const item of data.detail) {
      if (item && typeof item === 'object') {
        const it = item as Record<string, unknown>;
        const loc = Array.isArray(it.loc) ? it.loc : null;
        const msg = typeof it.msg === 'string' ? it.msg : null;

        if (loc && loc.length > 0 && msg) {
          // take the last path segment as field name (e.g. ['body','cpf'] -> 'cpf')
          const field = String(loc[loc.length - 1]);
          // only map simple string fields
          result[field] = msg;
        }
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  return null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await readResponseBody(response).catch(() => null);
    const message = normalizeErrorMessage(body) || `HTTP Error: ${response.status}`;
    const fieldErrors = extractFieldErrors(body);

    throw {
      status: response.status,
      message,
      fieldErrors,
    } satisfies ApiError;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

async function request<T>(endpoint: string, init: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    return await handleResponse<T>(response);
  } catch (error) {
    if (error instanceof TypeError) {
      throw {
        status: 0,
        message: 'Erro de conexão com a API. Verifique se o servidor está rodando.',
      } satisfies ApiError;
    }

    throw error;
  }
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put<T>(endpoint: string, data: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string): Promise<void> {
    return request<void>(endpoint, { method: 'DELETE' });
  },
};
