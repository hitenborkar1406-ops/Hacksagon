import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page Not Found</h1>
      <p className="not-found-sub">
        The route you requested doesn't exist in VitaFlow AI. 
        Check the URL or return to dashboard.
      </p>
      <Link to="/" className="not-found-link">
        ← Return to Dashboard
      </Link>
    </div>
  );
}
