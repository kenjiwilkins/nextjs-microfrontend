import { FeatureFlagProvider } from "./components/FeatureFlagProvider"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <FeatureFlagProvider>
      {children}
    </FeatureFlagProvider>
  )
}
