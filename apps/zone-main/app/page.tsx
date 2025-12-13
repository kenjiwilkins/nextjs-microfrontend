export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-blue-50 font-sans dark:bg-blue-950">
      <main className="flex flex-col items-center justify-center gap-8 p-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold">
            Main Zone
          </div>
          <h1 className="text-5xl font-bold text-blue-900 dark:text-blue-100">
            Multi-Zone PoC
          </h1>
          <p className="text-xl text-blue-700 dark:text-blue-300">
            This is the main zone running at <code className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded">/</code>
          </p>
        </div>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-blue-600 dark:text-blue-400">
            Navigate to different zones:
          </p>
          <div className="flex gap-4">
            <a
              href="/admin"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Admin Zone
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
