'use client'

import { useFeatureFlag } from './FeatureFlagProvider'

export default function WelcomeBanner() {
  const showBanner = useFeatureFlag('show_welcome_banner')

  if (!showBanner) {
    return null
  }

  return (
    <div className="w-full max-w-2xl p-6 bg-linear-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-2">Welcome to the New Feature!</h2>
      <p className="text-blue-100">
        This banner is controlled by the <code className="bg-white/20 px-2 py-1 rounded">show_welcome_banner</code> feature flag.
        Toggle it in the Admin Zone to see it appear/disappear!
      </p>
    </div>
  )
}
