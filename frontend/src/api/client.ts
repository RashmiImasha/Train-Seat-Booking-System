// Thin fetch wrapper: base URL, attaches the JWT if present, normalizes
// errors. Auth token is read from a module-level variable set by
// AuthContext, not localStorage -- see auth/AuthContext.tsx for the
// tradeoffs on that choice.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

let currentToken: string | null = null

export function setAuthToken(token: string | null) {
  currentToken = token
}

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(status: number, detail: unknown) {
    super(typeof detail === 'string' ? detail : `Request failed with status ${status}`)
    this.status = status
    this.detail = detail
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT'
  body?: unknown
  params?: Record<string, string | undefined>
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  
  console.log("Current token:", currentToken)
  
  const url = new URL(path, BASE_URL)
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) url.searchParams.set(key, value)
    }
  }

  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    let detail: unknown = null
    try {
      const data = await response.json()
      detail = data.detail ?? data
    } catch {
      // response had no JSON body
    }
    throw new ApiError(response.status, detail)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
