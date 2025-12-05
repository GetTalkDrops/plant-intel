// ============================================================================
// Plant Intel API Client (Client-Side)
// Centralized API communication with authentication and error handling
// For use in client components ("use client")
// ============================================================================

'use client';

import { useAuth } from '@clerk/nextjs';
import type {
  MappingProfile,
  CreateMappingProfileRequest,
  UpdateMappingProfileRequest,
  Analysis,
  ChatMessage,
  SendChatMessageRequest,
  SendChatMessageResponse,
  UploadCSVResponse,
  AnalyzerConfig,
  HealthCheckResponse,
  APIError,
} from '@/lib/types/api';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Retryable HTTP status codes

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sleep helper for retry delays with exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if HTTP status code is retryable
 */
const isRetryableStatusCode = (status: number): boolean => {
  return RETRY_STATUS_CODES.includes(status);
};

/**
 * Check if error is retryable (network error or retryable status code)
 */
const isRetryableError = (error: any, response?: Response): boolean => {
  // Network errors (no response)
  if (!response) {
    return true;
  }

  // Retryable HTTP status codes
  return isRetryableStatusCode(response.status);
};

// ============================================================================
// API Client Hook
// ============================================================================

export function useApiClient() {
  const { getToken } = useAuth();

  /**
   * Get authentication headers with Clerk JWT token
   */
  const getAuthHeaders = async (): Promise<HeadersInit> => {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  };

  /**
   * Handle API errors with detailed messages
   */
  const handleResponse = async <T,>(response: Response): Promise<T> => {
    if (!response.ok) {
      let errorMessage = `API error: ${response.status} ${response.statusText}`;

      try {
        const errorData: APIError = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If error response isn't JSON, use status text
      }

      throw new Error(errorMessage);
    }

    return response.json();
  };

  /**
   * Retry wrapper with exponential backoff
   *
   * Retries failed requests up to MAX_RETRIES times with exponential backoff.
   * Only retries on network errors or specific HTTP status codes (5xx, 429, 408).
   */
  const withRetry = async <T,>(
    fn: () => Promise<Response>,
    retries = MAX_RETRIES
  ): Promise<Response> => {
    let lastError: any;
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fn();

        // If response is OK or non-retryable error, return immediately
        if (response.ok || !isRetryableStatusCode(response.status)) {
          return response;
        }

        // Store response for potential retry
        lastResponse = response;
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        // Network error or fetch failure
        lastError = error;
        lastResponse = undefined;
      }

      // Don't sleep after the last attempt
      if (attempt < retries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`, lastError);
        await sleep(delay);
      }
    }

    // All retries exhausted
    console.error(`Request failed after ${retries + 1} attempts`, lastError);

    // If we have a response, return it (will be handled by handleResponse)
    if (lastResponse) {
      return lastResponse;
    }

    // No response means network error
    throw lastError || new Error('Request failed after multiple retries');
  };

  /**
   * Generic GET request with retry logic
   */
  const get = async <T,>(endpoint: string): Promise<T> => {
    const headers = await getAuthHeaders();

    const response = await withRetry(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers,
        cache: 'no-store', // Disable caching for real-time data
      })
    );

    return handleResponse<T>(response);
  };

  /**
   * Generic POST request with retry logic
   */
  const post = async <T,>(endpoint: string, data: any): Promise<T> => {
    const headers = await getAuthHeaders();

    const response = await withRetry(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      })
    );

    return handleResponse<T>(response);
  };

  /**
   * Generic PUT request with retry logic
   */
  const put = async <T,>(endpoint: string, data: any): Promise<T> => {
    const headers = await getAuthHeaders();

    const response = await withRetry(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      })
    );

    return handleResponse<T>(response);
  };

  /**
   * Generic DELETE request with retry logic
   */
  const del = async <T,>(endpoint: string): Promise<T> => {
    const headers = await getAuthHeaders();

    const response = await withRetry(() =>
      fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers,
      })
    );

    return handleResponse<T>(response);
  };

  /**
   * File upload with multipart/form-data
   */
  const upload = async <T,>(endpoint: string, file: File): Promise<T> => {
    const token = await getToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Note: Don't set Content-Type header - browser will set it with boundary
      },
      body: formData,
    });

    return handleResponse<T>(response);
  };

  // ============================================================================
  // Typed API Methods
  // ============================================================================

  return {
    // ============================================================================
    // Health Check
    // ============================================================================

    healthCheck: (): Promise<HealthCheckResponse> =>
      get('/api/v1/health'),

    // ============================================================================
    // Mapping Profiles
    // ============================================================================

    mappings: {
      list: (): Promise<MappingProfile[]> =>
        get('/api/v1/mappings'),

      get: (id: string): Promise<MappingProfile> =>
        get(`/api/v1/mappings/${id}`),

      create: (data: CreateMappingProfileRequest): Promise<MappingProfile> =>
        post('/api/v1/mappings', data),

      update: (id: string, data: UpdateMappingProfileRequest): Promise<MappingProfile> =>
        put(`/api/v1/mappings/${id}`, data),

      delete: (id: string): Promise<{ success: boolean }> =>
        del(`/api/v1/mappings/${id}`),
    },

    // ============================================================================
    // CSV Upload
    // ============================================================================

    upload: {
      csv: (file: File): Promise<UploadCSVResponse> =>
        upload('/api/v1/upload/csv', file),
    },

    // ============================================================================
    // Analyses
    // ============================================================================

    analyses: {
      list: (): Promise<{ success: boolean; analyses: Analysis[]; total: number; limit: number; offset: number }> =>
        get('/api/v1/analyze/list'),

      get: (id: string): Promise<{ success: boolean } & Analysis> =>
        get(`/api/v1/analyze/results/${id}`),

      getByBatch: (batchId: string): Promise<Analysis> =>
        get(`/api/v1/analyze/batch/${batchId}`),
    },

    // ============================================================================
    // Chat
    // ============================================================================

    chat: {
      sendMessage: (data: SendChatMessageRequest): Promise<SendChatMessageResponse> =>
        post('/api/v1/chat', data),

      getHistory: (analysisId?: string): Promise<{ messages: ChatMessage[]; count: number }> =>
        analysisId
          ? get(`/api/v1/chat/history/${analysisId}`)
          : get('/api/v1/chat/history'),
    },

    // ============================================================================
    // Analyzer Config
    // ============================================================================

    config: {
      get: (): Promise<AnalyzerConfig> =>
        get('/api/v1/config'),

      update: (data: Partial<AnalyzerConfig>): Promise<AnalyzerConfig> =>
        put('/api/v1/config', data),
    },

    // ============================================================================
    // Onboarding
    // ============================================================================

    setupOrganization: (data: any): Promise<any> =>
      post('/api/v1/onboarding/organization', data),

    getOnboardingStatus: (): Promise<any> =>
      get('/api/v1/onboarding/status'),

    skipOnboarding: (): Promise<any> =>
      post('/api/v1/onboarding/skip', {}),
  };
}
