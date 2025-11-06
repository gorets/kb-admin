// API client configuration
// You'll need to configure this with your actual API endpoint

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
export const TOKEN_STORAGE_KEY = 'kb_admin_token'

import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'

const tokenProvider = {
  token: () => {
    const token = getAuthToken()
    return token ? Promise.resolve(token) : Promise.resolve('')
  },
}

export const kbClient = new KnowledgeBaseClient({
  env: 'stage',
  token: tokenProvider,
});

export interface ApiConfig {
  baseURL: string
  headers?: Record<string, string>
}

// Get token from localStorage
export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

// Set token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

// Remove token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

// Get API config with authentication headers
export const getApiConfig = (): ApiConfig => {
  const token = getAuthToken()

  return {
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }
}

// Helper function to make authenticated API calls
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getApiConfig()
  const url = `${config.baseURL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...config.headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  // Handle empty responses
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export const apiConfig: ApiConfig = getApiConfig()
