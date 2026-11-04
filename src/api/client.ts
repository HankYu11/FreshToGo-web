import { BASE_URL } from './config'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string>
  /** Send the stored bearer token with this request. Defaults to false. */
  auth?: boolean
}

/**
 * A request that reached the server and came back with a non-2xx status.
 *
 * `status` is 0 when the request never got an answer at all — offline, DNS failure, a
 * webview that killed the connection. Callers show a different state for that, so the
 * distinction has to survive to the UI rather than collapsing into one "failed" branch.
 */
export class ApiError extends Error {
  readonly status: number
  readonly data?: unknown
  /** Backend `error.code` (e.g. BOX_SOLD_OUT, USER_BLOCKED) when the body carried one. */
  readonly code?: string

  constructor(status: number, message: string, data?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = extractErrorCode(data)
  }

  /** The request never reached the server (offline, DNS, connection dropped). */
  get isOffline() {
    return this.status === 0
  }
}

function extractErrorCode(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const error = (data as { error?: unknown }).error
  if (typeof error !== 'object' || error === null) return undefined
  const code = (error as { code?: unknown }).code
  return typeof code === 'string' ? code : undefined
}

/** Human-readable `error.message` from the backend envelope, when it sent one. */
export function apiErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  const data = error.data
  if (typeof data !== 'object' || data === null) return undefined
  const inner = (data as { error?: unknown }).error
  if (typeof inner !== 'object' || inner === null) return undefined
  const message = (inner as { message?: unknown }).message
  return typeof message === 'string' && message.trim() ? message : undefined
}

let authToken: string | null = null

/** Store the bearer token sent with `auth: true` requests. Pass null to clear it. */
export function setAuthToken(token: string | null) {
  authToken = token
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, auth, ...rest } = options

  let url = `${BASE_URL}${endpoint}`
  if (params) {
    const search = new URLSearchParams(params)
    url += `?${search.toString()}`
  }

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(auth && authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(url, config)
  } catch (cause) {
    // fetch only rejects when the request never completed — treat every such failure as offline.
    throw new ApiError(0, cause instanceof Error ? cause.message : 'Network request failed')
  }

  if (!response.ok) {
    let data: unknown
    try {
      data = await response.json()
    } catch {
      // no JSON body
    }
    throw new ApiError(response.status, response.statusText, data)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'GET' })
  },
  post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>(endpoint, { ...options, method: 'POST', body })
  },
  put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>(endpoint, { ...options, method: 'PUT', body })
  },
  patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) {
    return request<T>(endpoint, { ...options, method: 'PATCH', body })
  },
  delete(endpoint: string, options?: RequestOptions): Promise<void> {
    return request<void>(endpoint, { ...options, method: 'DELETE' })
  },
}
