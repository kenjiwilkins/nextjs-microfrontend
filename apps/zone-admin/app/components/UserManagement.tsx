'use client'

import { useEffect, useState } from 'react'

// TypeScript interface matching the backend's User struct
interface User {
  id: number
  email: string
  name: string
  createdAt: string
  updatedAt: string
}

export default function UserManagement() {
  // State to store the list of users from the database
  const [users, setUsers] = useState<User[]>([])
  // State to track loading status
  const [loading, setLoading] = useState(true)
  // State to store any errors
  const [error, setError] = useState<string | null>(null)
  // State for the new user form
  const [newUser, setNewUser] = useState({ name: '', email: '' })
  // State to show if we're currently creating a user
  const [creating, setCreating] = useState(false)
  // State to track seeding operation
  const [seeding, setSeeding] = useState(false)

  // Backend URL (can be configured via environment variable)
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

  // Function to fetch all users from the backend
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/users`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Parse the JSON response
      const data: User[] = await response.json()
      setUsers(data)
      setError(null)
    } catch (err) {
      // If there's an error, store it in state
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      // Always set loading to false when done
      setLoading(false)
    }
  }

  // useEffect runs when the component mounts
  // It fetches users immediately
  useEffect(() => {
    fetchUsers()
  }, []) // Empty dependency array means this runs once on mount

  // Function to create a new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault() // Prevent form from submitting normally

    // Validate inputs
    if (!newUser.name || !newUser.email) {
      setError('Name and email are required')
      return
    }

    setCreating(true)
    setError(null)

    try {
      // Send POST request to create a new user
      const response = await fetch(`${backendUrl}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to create user')
      }

      // Clear the form
      setNewUser({ name: '', email: '' })

      // Refresh the user list
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  // Function to delete a user
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`${backendUrl}/api/users/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      // Refresh the user list
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  // Function to seed the database with sample data
  const handleSeedDatabase = async () => {
    if (!confirm('This will add 5 sample users to the database. Continue?')) {
      return
    }

    setSeeding(true)
    setError(null)

    try {
      const response = await fetch(`${backendUrl}/api/seed`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to seed database')
      }

      // Show success message
      alert(`Database seeded successfully!\nCreated: ${result.created}\nSkipped: ${result.skipped}`)

      // Refresh the user list
      await fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed database')
    } finally {
      setSeeding(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full max-w-4xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
          User Management
        </h2>
        <p className="text-purple-600 dark:text-purple-300">Loading users...</p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl p-6 bg-white dark:bg-purple-900 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4">
        User Management
      </h2>

      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      {/* Create New User Form */}
      <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-purple-50 dark:bg-purple-800 rounded-lg">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-3">
          Add New User
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="flex-1 min-w-[200px] px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100"
            disabled={creating}
          />
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            className="flex-1 min-w-[200px] px-3 py-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-purple-700 text-purple-900 dark:text-purple-100"
            disabled={creating}
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
          >
            {creating ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </form>

      {/* Users List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
            Users ({users.length})
          </h3>
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {seeding ? 'Seeding...' : 'Seed Database'}
          </button>
        </div>

        {users.length === 0 ? (
          <p className="text-purple-600 dark:text-purple-300">
            No users found. Add your first user above or use the &quot;Seed Database&quot; button!
          </p>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="p-4 border border-purple-200 dark:border-purple-700 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      {user.name}
                    </h4>
                    <span className="text-sm text-purple-500 dark:text-purple-400">
                      #{user.id}
                    </span>
                  </div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    {user.email}
                  </p>
                  <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                    Created: {new Date(user.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
