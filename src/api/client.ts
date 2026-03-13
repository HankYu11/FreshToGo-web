const BASE_URL = import.meta.env.VITE_API_URL || 'https://handyla.co'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  params?: Record<string, string>
}

interface ApiError {
  status: number
  message: string
  data?: unknown
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, ...rest } = options

  let url = `${BASE_URL}${endpoint}`
  if (params) {
    const search = new URLSearchParams(params)
    url += `?${search.toString()}`
  }

  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }

  if (body !== undefined) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(url, config)

  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: response.statusText,
    }
    try {
      error.data = await response.json()
    } catch {
      // no JSON body
    }
    throw error
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
