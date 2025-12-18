/**
 * API Client with retry logic and timeout configuration
 * Validates: Requirements 1.4
 */

const API_BASE = 'http://127.0.0.1:51731/api'

export interface FetchConfig {
  retries?: number
  timeout?: number
  retryDelay?: number
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Determines if an error is retryable (transient)
 * Retryable: network errors, timeouts, 5xx server errors
 * Non-retryable: 4xx client errors
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TimeoutError) {
    return true
  }
  if (error instanceof ApiError) {
    // 5xx errors are retryable, 4xx are not
    return error.status >= 500
  }
  // Network errors (TypeError from fetch) are retryable
  if (error instanceof TypeError) {
    return true
  }
  return false
}

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number, baseDelay: number): number {
  return baseDelay * Math.pow(2, attempt)
}

/**
 * Fetch with retry logic and timeout
 * Implements exponential backoff for transient errors
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  config?: FetchConfig
): Promise<Response> {
  const { retries = 3, timeout = 10000, retryDelay = 1000 } = config || {}

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const error = new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response.statusText
        )
        
        // Don't retry client errors (4xx)
        if (!isRetryableError(error)) {
          throw error
        }
        
        lastError = error
        
        // If this is the last attempt, throw
        if (attempt === retries) {
          throw error
        }
        
        // Wait before retrying
        await new Promise(r => setTimeout(r, calculateBackoffDelay(attempt, retryDelay)))
        continue
      }

      return response
    } catch (error) {
      // Handle abort (timeout)
      if (error instanceof DOMException && error.name === 'AbortError') {
        lastError = new TimeoutError(`Request timeout after ${timeout}ms`)
      } else if (error instanceof Error) {
        lastError = error
      } else {
        lastError = new Error(String(error))
      }

      // Check if we should retry
      if (!isRetryableError(lastError) || attempt === retries) {
        throw lastError
      }

      // Wait before retrying with exponential backoff
      await new Promise(r => setTimeout(r, calculateBackoffDelay(attempt, retryDelay)))
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

/**
 * API client helper functions
 */
export const api = {
  async get<T>(endpoint: string, config?: FetchConfig): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, config)
    return response.json()
  },

  async post<T>(endpoint: string, data?: unknown, config?: FetchConfig): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    }, config)
    return response.json()
  },

  async put<T>(endpoint: string, data?: unknown, config?: FetchConfig): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    }, config)
    return response.json()
  },

  async patch<T>(endpoint: string, data?: unknown, config?: FetchConfig): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    }, config)
    return response.json()
  },

  async delete<T>(endpoint: string, config?: FetchConfig): Promise<T> {
    const response = await fetchWithRetry(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }, config)
    // Handle 204 No Content responses
    if (response.status === 204) {
      return undefined as T
    }
    return response.json()
  },
}

export { API_BASE }
