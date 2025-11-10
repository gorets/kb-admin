import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'

export const TOKEN_STORAGE_KEY = 'kb_admin_token'

const tokenProvider = {
  token: () => {
    const token = getAuthToken()
    return token ? Promise.resolve(token) : Promise.resolve('')
  },
}

export const kbClient = new KnowledgeBaseClient({
  env: 'stage',
  token: tokenProvider,
  // endpoint: () => {
  //   return {
  //     hostname: 'localhost',
  //     protocol: "http",
  //     port: '3000',
  //     path: ''
  //   }
  // }
})

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
