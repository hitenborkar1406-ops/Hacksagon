/**
 * PlanGate.jsx
 * Renders children if plan meets requiredPlan, otherwise renders fallback.
 */
import { usePlan } from '../../hooks/usePlan.js';
import PremiumUpgradeCard from './PremiumUpgradeCard.jsx';

export default function PlanGate({ requiredPlan = 'premium', fallback, children }) {
  const { plan } = usePlan();

  const LEVELS = { basic: 1, premium: 2 };
  const userLevel = LEVELS[plan] ?? 0;
  const required = LEVELS[requiredPlan] ?? 2;

  if (userLevel >= required) return children;

  return fallback ?? <PremiumUpgradeCard />;
}
