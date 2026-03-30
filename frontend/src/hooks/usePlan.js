import { usePlanContext } from '../context/PlanContext.jsx';

export function usePlan() {
  const ctx = usePlanContext();
  return {
    isAuthenticated: ctx.isAuthenticated,
    plan:            ctx.plan,
    patientInfo:     ctx.patientInfo,
    login:           ctx.login,
    logout:          ctx.logout,
    isPremium:       ctx.plan === 'premium',
    isBasic:         ctx.plan === 'basic',
  };
}
