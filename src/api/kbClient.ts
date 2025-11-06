// API Client using @wildix/wim-knowledge-base-client
import { KnowledgeBaseClient } from '@wildix/wim-knowledge-base-client'
import { getApiConfig } from './client'

/**
 * Initialize the Knowledge Base client from the official package
 * This function creates a configured client instance with authentication
 */
function createKBClient() {
  const config = getApiConfig()

  return new KnowledgeBaseClient({
    baseUrl: config.baseURL,
    headers: config.headers,
  })
}

// Export a singleton instance
export const kbClient = createKBClient()

// Re-export for convenience
export { createKBClient }
