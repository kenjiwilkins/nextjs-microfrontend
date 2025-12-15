import ZoneHealthStatus from './components/ZoneHealthStatus'
import UserManagement from './components/UserManagement'
import FeatureFlagManagement from './components/FeatureFlagManagement'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 font-sans dark:bg-purple-950">
      <main className="flex flex-col items-center justify-center gap-8 p-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-lg bg-purple-600 px-6 py-2 text-white font-semibold">
            Admin Zone
          </div>
          <h1 className="text-5xl font-bold text-purple-900 dark:text-purple-100">
            Multi-Zone PoC
          </h1>
          <p className="text-xl text-purple-700 dark:text-purple-300">
            This is the admin zone running at <code className="bg-purple-200 dark:bg-purple-800 px-2 py-1 rounded">/admin</code>
          </p>
        </div>

        {/* Display health status from the Go backend */}
        <ZoneHealthStatus />

        {/* User management with PostgreSQL backend */}
        <UserManagement />

        {/* Feature flag management */}
        <FeatureFlagManagement />

        <div className="flex flex-col gap-4 text-center">
          <p className="text-purple-600 dark:text-purple-400">
            Navigate to different zones:
          </p>
          <div className="flex gap-4">
            <a
              href="/"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Main Zone
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
