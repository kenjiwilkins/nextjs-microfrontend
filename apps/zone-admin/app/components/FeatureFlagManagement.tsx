'use client'

import { useEffect, useState } from 'react'

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

export default function FeatureFlagManagement() {
  // State to store the list of feature flags from the database
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to store any errors
  const [error, setError] = useState<string | null>(null)
  // State for the new flag form
  const [newFlag, setNewFlag] = useState({ key: '', name: '', description: '' })
  // State to show if we're currently creating a flag
  const [creating, setCreating] = useState(false)

  // Backend URL (can be configured via environment variable)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

  // Function to fetch all feature flags from the backend
  const fetchFlags = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/feature-flags`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Parse the JSON response
      const data: FeatureFlag[] = await response.json()
      setFlags(data)
      setError(null)
    } catch (err) {
      // If there's an error, store it in state
      setError(err instanceof Error ? err.message : 'Failed to fetch feature flags')
    } finally {
      // Always set loading to false when done
      setLoading(false)
    }
  }

  // useEffect runs when the component mounts
  // It fetches flags immediately
  useEffect(() => {
    fetchFlags()
  }, []) // Empty dependency array means this runs once on mount

  // Function to create a new feature flag
  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form from submitting normally

    // Validate inputs
    if (!newFlag.key || !newFlag.name) {
      setError('Key and name are required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Send POST request to create a new flag
      const response = await fetch(`${backendUrl}/api/feature-flags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newFlag,
          enabled: false // New flags start disabled by default
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create feature flag')
      }

      // Parse the created flag from the response
      const createdFlag: FeatureFlag = await response.json()

      // Add the new flag to the local state instead of re-fetching
      setFlags([...flags, createdFlag])

      // Clear the form
      setNewFlag({ key: '', name: '', description: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create feature flag')
    } finally {
      setCreating(false)
    }
  }

  // Function to toggle a feature flag's enabled state
  const handleToggleFlag = async (key: string, currentState: boolean) => {
    try {
      const response = await fetch(`${backendUrl}/api/feature-flags/${key}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !currentState
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle feature flag')
      }

      // Parse the updated flag from the response
      const updatedFlag: FeatureFlag = await response.json()

      // Update the specific flag in local state instead of re-fetching
      setFlags(flags.map(flag => flag.key === key ? updatedFlag : flag))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle feature flag')
    }
  }

  // Function to delete a feature flag
  const handleDeleteFlag = async (key: string) => {
    if (!confirm(`Are you sure you want to delete the feature flag "${key}"?`)) {
      return
    }

    try {
      const response = await fetch(`${backendUrl}/api/feature-flags/${key}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete feature flag')
      }

      // Remove the flag from local state instead of re-fetching
      setFlags(flags.filter(flag => flag.key !== key))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete feature flag')
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
          Feature Flag Management
        </h2>
        <p className="text-purple-600 dark:text-purple-300">Loading feature flags...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
        Feature Flag Management
      </h2>

      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Create New Feature Flag Form */}
      <form onSubmit={handleCreateFlag} className="mb-6 p-4 bg-purple-50 dark:bg-purple-800 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
          Add New Feature Flag
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Key (e.g., new_dashboard)"
              value={newFlag.key}
              onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
              className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100"
              disabled={creating}
            />
            <input
              type="text"
              placeholder="Name (e.g., New Dashboard)"
              value={newFlag.name}
              onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
              className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100"
              disabled={creating}
            />
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Description (optional)"
              value={newFlag.description}
              onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
              className="flex-1 px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100"
              disabled={creating}
            />
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
            >
              {creating ? 'Adding...' : 'Add Flag'}
            </button>
          </div>
        </div>
      </form>

      {/* Feature Flags List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
          Feature Flags ({flags.length})
        </h3>

        {flags.length === 0 ? (
          <p className="text-purple-600 dark:text-purple-300">
            No feature flags found. Add your first feature flag above!
          </p>
        ) : (
          <div className="space-y-2">
            {flags.map((flag) => (
              <div
                key={flag.id}
                className="p-4 border border-purple-200 dark:border-purple-700 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      {flag.name}
                    </h4>
                    <span className="px-2 py-1 text-xs font-mono bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded">
                      {flag.key}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      flag.enabled
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {flag.enabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>
                  {flag.description && (
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                      {flag.description}
                    </p>
                  )}
                  <p className="text-xs text-purple-500 dark:text-purple-400">
                    Created: {new Date(flag.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleFlag(flag.key, flag.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteFlag(flag.key)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
