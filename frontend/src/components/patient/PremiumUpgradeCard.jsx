/**
 * PremiumUpgradeCard.jsx
 * Inline card shown when a basic plan user hits a premium-gated section.
 */
export default function PremiumUpgradeCard({ message }) {
  return (
    <div className="premium-upgrade-card">
      <svg className="premium-lock-icon" viewBox="0 0 24 24" fill="none" stroke="#8A97A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div className="premium-upgrade-content">
        <div className="premium-upgrade-title">Premium Plan Feature</div>
        <div className="premium-upgrade-text">
          {message ||
            'This information is available on the Premium Plan. Ask your doctor or nursing staff to upgrade your access.'}
        </div>
      </div>
    </div>
  );
}
