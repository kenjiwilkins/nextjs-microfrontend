// Server-side feature flag utility for Next.js
// This module provides functions to check feature flags from the backend API
// with caching to improve performance

// Backend URL - defaults to localhost for local development
const BACKEND_URL = process.env.BACKEND_URL || 'http://backend:8080'

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

/**
 * Fetch a feature flag from the backend API
 * This function uses Next.js's built-in fetch caching
 *
 * @param key - The feature flag key to fetch
 * @returns Promise<boolean> - Whether the flag is enabled (defaults to false on error)
 */
export async function getFeatureFlag(key: string): Promise<boolean> {
  try {
    // Fetch feature flag from backend with caching
    // Next.js will cache this for 60 seconds by default
    const response = await fetch(`${BACKEND_URL}/api/feature-flags/${key}`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      // If flag doesn't exist or API is down, default to false
      console.warn(`Feature flag "${key}" not found or API error, defaulting to false`)
      return false
    }

    const flag: FeatureFlag = await response.json()
    return flag.enabled
  } catch (error) {
    // On any error, gracefully default to false (fail-safe behavior)
    console.error(`Error fetching feature flag "${key}":`, error)
    return false
  }
}

/**
 * Fetch all feature flags from the backend API
 * Useful for checking multiple flags at once
 *
 * @returns Promise<FeatureFlag[]> - Array of all feature flags
 */
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/feature-flags`, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    })

    if (!response.ok) {
      console.warn('Failed to fetch feature flags, returning empty array')
      return []
    }

    const flags: FeatureFlag[] = await response.json()
    return flags
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }
}

/**
 * Check if a feature flag is enabled
 * This is an alias for getFeatureFlag for better readability
 *
 * @param key - The feature flag key to check
 * @returns Promise<boolean> - Whether the flag is enabled
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  return getFeatureFlag(key)
}
