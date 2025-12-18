/**
 * Property-based tests for API Client
 * **Feature: lifeflow-v2, Property 1: API Client Retry Logic**
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import * as fc from 'fast-check'
import {
  fetchWithRetry,
  isRetryableError,
  calculateBackoffDelay,
  ApiError,
  TimeoutError,
} from './client'

describe('API Client - Property Tests', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  /**
   * **Feature: lifeflow-v2, Property 1: API Client Retry Logic**
   * **Validates: Requirements 1.4**
   * 
   * For any API request that fails with a transient error (network timeout, 5xx status),
   * the client should retry up to the configured number of times with exponential backoff
   * before throwing an error.
   */
  describe('Property 1: Retry Logic', () => {
    it('should correctly identify retryable errors', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 500, max: 599 }),
          (statusCode) => {
            const error = new ApiError(`HTTP ${statusCode}`, statusCode, 'Server Error')
            expect(isRetryableError(error)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly identify non-retryable errors (4xx)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 400, max: 499 }),
          (statusCode) => {
            const error = new ApiError(`HTTP ${statusCode}`, statusCode, 'Client Error')
            expect(isRetryableError(error)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should identify TimeoutError as retryable', () => {
      const error = new TimeoutError('Request timeout')
      expect(isRetryableError(error)).toBe(true)
    })

    it('should identify TypeError (network error) as retryable', () => {
      const error = new TypeError('Failed to fetch')
      expect(isRetryableError(error)).toBe(true)
    })
  })

  describe('Property: Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff correctly for any attempt and base delay', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          fc.integer({ min: 100, max: 5000 }),
          (attempt, baseDelay) => {
            const delay = calculateBackoffDelay(attempt, baseDelay)
            const expected = baseDelay * Math.pow(2, attempt)
            expect(delay).toBe(expected)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should produce increasing delays for consecutive attempts', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 5000 }),
          (baseDelay) => {
            const delays = [0, 1, 2, 3, 4].map(attempt => 
              calculateBackoffDelay(attempt, baseDelay)
            )
            
            // Each delay should be greater than the previous
            for (let i = 1; i < delays.length; i++) {
              expect(delays[i]).toBeGreaterThan(delays[i - 1])
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Property: Retry Count Behavior', () => {
    it('should retry exactly the configured number of times for retryable errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 3 }),
          async (retries) => {
            let attemptCount = 0
            
            // Mock fetch to always fail with 500
            const mockFetch = vi.fn().mockImplementation(() => {
              attemptCount++
              return Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
              })
            })
            
            vi.stubGlobal('fetch', mockFetch)
            
            try {
              await fetchWithRetry('http://test.com/api', undefined, {
                retries,
                timeout: 10000,
                retryDelay: 1, // Minimal delay for testing
              })
              // Should not reach here
              expect(true).toBe(false)
            } catch (error) {
              expect(error).toBeInstanceOf(ApiError)
            }
            
            // Should have made retries + 1 attempts (initial + retries)
            expect(attemptCount).toBe(retries + 1)
            
            vi.unstubAllGlobals()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should not retry for non-retryable errors (4xx)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 400, max: 499 }),
          fc.integer({ min: 1, max: 3 }),
          async (statusCode, retries) => {
            let attemptCount = 0
            
            const mockFetch = vi.fn().mockImplementation(() => {
              attemptCount++
              return Promise.resolve({
                ok: false,
                status: statusCode,
                statusText: 'Client Error',
              })
            })
            
            vi.stubGlobal('fetch', mockFetch)
            
            try {
              await fetchWithRetry('http://test.com/api', undefined, {
                retries,
                timeout: 10000,
                retryDelay: 1,
              })
              expect(true).toBe(false)
            } catch (error) {
              expect(error).toBeInstanceOf(ApiError)
            }
            
            // Should only make 1 attempt for non-retryable errors
            expect(attemptCount).toBe(1)
            
            vi.unstubAllGlobals()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should succeed immediately on successful response', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 200, max: 299 }),
          fc.integer({ min: 1, max: 3 }),
          async (statusCode, retries) => {
            let attemptCount = 0
            
            const mockFetch = vi.fn().mockImplementation(() => {
              attemptCount++
              return Promise.resolve({
                ok: true,
                status: statusCode,
                statusText: 'OK',
                json: () => Promise.resolve({ data: 'test' }),
              })
            })
            
            vi.stubGlobal('fetch', mockFetch)
            
            const response = await fetchWithRetry('http://test.com/api', undefined, {
              retries,
              timeout: 10000,
              retryDelay: 1,
            })
            
            expect(response.ok).toBe(true)
            expect(attemptCount).toBe(1)
            
            vi.unstubAllGlobals()
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should succeed after transient failures if within retry limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }),
          async (failuresBeforeSuccess) => {
            const retries = failuresBeforeSuccess + 1 // Ensure we have enough retries
            let attemptCount = 0
            
            const mockFetch = vi.fn().mockImplementation(() => {
              attemptCount++
              if (attemptCount <= failuresBeforeSuccess) {
                return Promise.resolve({
                  ok: false,
                  status: 500,
                  statusText: 'Internal Server Error',
                })
              }
              return Promise.resolve({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: () => Promise.resolve({ data: 'test' }),
              })
            })
            
            vi.stubGlobal('fetch', mockFetch)
            
            const response = await fetchWithRetry('http://test.com/api', undefined, {
              retries,
              timeout: 10000,
              retryDelay: 1,
            })
            
            expect(response.ok).toBe(true)
            expect(attemptCount).toBe(failuresBeforeSuccess + 1)
            
            vi.unstubAllGlobals()
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
