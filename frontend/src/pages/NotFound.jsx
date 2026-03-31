import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-sub">
        The route you requested doesn't exist in IV DRIP SYSTEM. 
        Check the URL or return to dashboard.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/login" className="not-found-link">
          Sign in
        </Link>
        <Link to="/" className="not-found-link">
          ← Dashboard
        </Link>
      </div>
    </div>
  );
}
