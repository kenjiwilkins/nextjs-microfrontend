'use client'

import { useEffect, useState } from 'react'

// TypeScript interface matching the backend's ZoneStatus struct
interface ZoneStatus {
  name: string
  status: string
  url: string
  lastCheck: string
  message: string
}

// TypeScript interface matching the backend's HealthResponse struct
interface HealthResponse {
  status: string
  zones: ZoneStatus[]
}

export default function ZoneHealthStatus() {
  // State to store the health data from the backend
  const [health, setHealth] = useState<HealthResponse | null>(null)
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to store any errors
  const [error, setError] = useState<string | null>(null)

  // useEffect runs when the component mounts
  // It fetches health data from the backend API
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // Call the backend API
        // In production, this would be the backend service URL
        // For local development with port forwarding, use localhost:8080
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
        const response = await fetch(`${backendUrl}/api/zones/status`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Parse the JSON response
        const data: HealthResponse = await response.json()
        setHealth(data)
        setError(null)
      } catch (err) {
        // If there's an error, store it in state
        setError(err instanceof Error ? err.message : 'Failed to fetch health status')
      } finally {
        // Always set loading to false when done
        setLoading(false)
      }
    }

    // Fetch immediately on mount
    fetchHealth()

    // Set up an interval to fetch every 10 seconds
    // This keeps the health status up to date
    const interval = setInterval(fetchHealth, 10000)

    // Cleanup function: clear the interval when component unmounts
    return () => clearInterval(interval)
  }, []) // Empty dependency array means this runs once on mount

  // Function to determine the color based on health status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'degraded':
        return 'bg-yellow-500'
      case 'unhealthy':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
          Zone Health Status
        </h2>
        <p className="text-purple-600 dark:text-purple-300">Loading...</p>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full max-w-2xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
          Zone Health Status
        </h2>
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <p className="text-sm text-purple-600 dark:text-purple-400 mt-2">
          Make sure the backend service is running at http://localhost:8080
        </p>
      </div>
    )
  }

  // Show the health data
  return (
    <div className="w-full max-w-2xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
        Zone Health Status
      </h2>

      <div className="space-y-4">
        {health?.zones.map((zone) => (
          <div
            key={zone.name}
            className="p-4 border border-purple-200 dark:border-purple-700 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                {zone.name}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(
                  zone.status
                )}`}
              >
                {zone.status}
              </span>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {zone.message}
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
              URL: {zone.url}
            </p>
            <p className="text-xs text-purple-500 dark:text-purple-400">
              Last checked: {new Date(zone.lastCheck).toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-purple-500 dark:text-purple-400 mt-4 text-center">
        Auto-refreshes every 10 seconds
      </p>
    </div>
  )
}
