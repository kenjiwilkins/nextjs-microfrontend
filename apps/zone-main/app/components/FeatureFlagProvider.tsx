'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

// TypeScript interface matching the backend's FeatureFlag struct
interface FeatureFlag {
  id: number
  key: string
  name: string
  description: string
  enabled: boolean
  createdAt: string
  updatedAt: string
}

// Context type
interface FeatureFlagContextType {
  flags: Record<string, boolean>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Create context with default values
const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: {},
  loading: true,
  error: null,
  refetch: async () => {},
})

// Provider props
interface FeatureFlagProviderProps {
  children: ReactNode
}

// Provider component
export function FeatureFlagProvider({ children }: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Backend URL - uses localhost for client-side fetch
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

  // Fetch all feature flags from the backend
  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`${backendUrl}/api/feature-flags`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: FeatureFlag[] = await response.json()

      // Convert array to key-value map for easy lookup
      const flagMap: Record<string, boolean> = {}
      data.forEach(flag => {
        flagMap[flag.key] = flag.enabled
      })

      setFlags(flagMap)
      setError(null)
    } catch (err) {
      console.error('Error fetching feature flags:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch feature flags')
      // On error, keep existing flags or use empty object
    } finally {
      setLoading(false)
    }
  }, [backendUrl])

  // Fetch flags on mount and set up polling
  useEffect(() => {
    fetchFlags()

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchFlags, 10000)

    return () => clearInterval(interval)
  }, [fetchFlags])

  return (
    <FeatureFlagContext.Provider value={{ flags, loading, error, refetch: fetchFlags }}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

// Hook to check if a feature flag is enabled
export function useFeatureFlag(key: string): boolean {
  const { flags } = useContext(FeatureFlagContext)
  return flags[key] ?? false // Default to false if flag doesn't exist
}

// Hook to get all flags and metadata
export function useFeatureFlags() {
  return useContext(FeatureFlagContext)
}
