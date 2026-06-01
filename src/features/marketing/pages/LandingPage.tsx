import { Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth'
import {
  MarketingNav,
  Hero,
  Stats,
  LogoBar,
  HowItWorks,
  FeaturePlan,
  FeatureCoach,
  FeatureGrid,
  Testimonial,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from '../components/LandingSections'
import '@/styles/marketing.css'

// ─── Redirect logged-in users to dashboard ───────────────────────────────────
export function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ background: 'var(--xn-paper)', minHeight: '100vh' }}>
      <MarketingNav />
      <Hero />
      <Stats />
      <LogoBar />
      <HowItWorks />
      <FeaturePlan />
      <FeatureCoach />
      <FeatureGrid />
      <Testimonial />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}
