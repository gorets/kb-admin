// API Service using @wildix/wim-knowledge-base-client
import { getApiConfig } from './client'

// Types from the client (you may need to import these from the actual package)
// import type { ... } from '@wildix/wim-knowledge-base-client'

// For now, we'll use our local types and create a wrapper
// Once the package is available, replace these with actual imports

interface ClientConfig {
  baseUrl: string
  headers?: Record<string, string>
}

/**
 * Initialize the Knowledge Base client
 * This function creates a configured client instance
 */
function createKBClient() {
  const config = getApiConfig()

  // TODO: Replace with actual client initialization when package is available
  // import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
  // return new KnowledgeBaseClient({
  //   baseUrl: config.baseURL,
  //   headers: config.headers,
  // })

  // For now, return a fetch-based implementation
  const clientConfig: ClientConfig = {
    baseUrl: config.baseURL,
    headers: config.headers,
  }

  return {
    config: clientConfig,

    // Helper method for making requests
    async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${clientConfig.baseUrl}${endpoint}`

      const response = await fetch(url, {
        ...options,
        headers: {
          ...clientConfig.headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error ${response.status}: ${errorText}`)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T
      }

      const text = await response.text()
      return text ? JSON.parse(text) : null
    },
  }
}

// Export a singleton instance
export const kbClient = createKBClient()

// Re-export for convenience
export { createKBClient }
