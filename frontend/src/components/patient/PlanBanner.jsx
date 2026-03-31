/**
 * PlanBanner.jsx
 * Displays a rich Basic / Premium plan card in the patient view.
 * Shows current plan with feature highlights and a clear upgrade prompt for basic users.
 */
import { usePlan } from '../../hooks/usePlan.js';

const BASIC_FEATURES = [
  { icon: '❤️', label: 'Heart Rate (live)' },
  { icon: '🩸', label: 'SpO₂ Saturation (live)' },
  { icon: '💧', label: 'IV Drip Status' },
  { icon: '📋', label: 'Today\'s Sessions' },
  { icon: '📜', label: 'Treatment History' },
];

const PREMIUM_FEATURES = [
  { icon: '📊', label: 'Drug Response Curves' },
  { icon: '🤖', label: 'AI-Powered Health Insights' },
  { icon: '📈', label: 'Efficacy Scoring' },
  { icon: '📤', label: 'Export & Share Reports' },
  { icon: '🔔', label: 'Critical Alerts Feed' },
];

export default function PlanBanner() {
  const { plan, isPremium } = usePlan();

  if (!plan) return null;

  return (
    <div className="plan-banner-wrap">
      {/* ── Basic Plan Card ── */}
      <div className={`plan-tier-card ${!isPremium ? 'plan-tier-active' : 'plan-tier-inactive'}`}>
        <div className="plan-tier-header">
          <span className="plan-tier-badge basic-badge">Basic Plan</span>
          {!isPremium && <span className="plan-tier-current-tag">✓ Your Plan</span>}
        </div>
        <p className="plan-tier-desc">Essential monitoring for patients &amp; family.</p>
        <ul className="plan-feature-list">
          {BASIC_FEATURES.map((f) => (
            <li key={f.label} className="plan-feature-item">
              <span className="plan-feature-icon">{f.icon}</span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Premium Plan Card ── */}
      <div className={`plan-tier-card ${isPremium ? 'plan-tier-active premium-active' : 'plan-tier-inactive'}`}>
        <div className="plan-tier-header">
          <span className="plan-tier-badge premium-badge">Premium Plan ★</span>
          {isPremium && <span className="plan-tier-current-tag">✓ Your Plan</span>}
        </div>
        <p className="plan-tier-desc">Full clinical data + AI analysis.</p>
        <ul className="plan-feature-list">
          {BASIC_FEATURES.map((f) => (
            <li key={f.label} className="plan-feature-item included">
              <span className="plan-feature-icon">✓</span>
              <span>{f.label}</span>
            </li>
          ))}
          {PREMIUM_FEATURES.map((f) => (
            <li key={f.label} className={`plan-feature-item ${isPremium ? 'premium-highlight' : 'locked-feature'}`}>
              <span className="plan-feature-icon">{isPremium ? f.icon : '🔒'}</span>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
        {!isPremium && (
          <div className="plan-upgrade-note">
            Ask your doctor or nursing staff to upgrade to Premium access.
          </div>
        )}
      </div>
    </div>
  );
}
