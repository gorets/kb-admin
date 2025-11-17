import { useState, useCallback } from 'react'
import Nango from '@nangohq/frontend'

interface NangoAuthResult {
  connectionId: string
  [key: string]: any
}

interface UseNangoAuthReturn {
  authenticate: (integrationId: string, sessionToken: string) => Promise<NangoAuthResult>
  isLoading: boolean
  error: Error | null
}

/**
 * Hook to handle Nango OAuth authentication flow
 * Manages OAuth authorization via Nango service
 */
export function useNangoAuth(): UseNangoAuthReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const authenticate = useCallback(
    async (integrationId: string, sessionToken: string): Promise<NangoAuthResult> => {
      setIsLoading(true)
      setError(null)

      try {
        // Initialize Nango client with session token
        const nangoHost = import.meta.env.VITE_NANGO_HOST || 'https://wim-auth-stage.wildix.com'
        const nango = new Nango({
          host: nangoHost,
          connectSessionToken: sessionToken,
        })

        // Trigger OAuth flow
        const result = await nango.auth(integrationId, {
          detectClosedAuthWindow: true,
        })

        setIsLoading(false)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Authentication failed')
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    []
  )

  return { authenticate, isLoading, error }
}
