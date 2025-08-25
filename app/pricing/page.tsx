import PricingPage from '../../components/PricingPage'
import ErrorBoundary from '../../components/ErrorBoundary'

export default function Pricing() {
  return (
    <ErrorBoundary>
      <PricingPage />
    </ErrorBoundary>
  )
}
