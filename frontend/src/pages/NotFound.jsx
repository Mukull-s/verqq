import { Link, useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="wrap" style={{ paddingTop: 80, paddingBottom: 80, display: 'flex', justifyContent: 'center' }}>
      <div className="card card--lg card--pad" style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 600, color: 'var(--ink-4)' }}>404</p>
        <h1 style={{ fontSize: 22, marginTop: 4 }}>Page not found</h1>
        <p className="lead" style={{ fontSize: 13.5, marginTop: 10 }}>
          The page you’re looking for doesn’t exist or may have moved. Check the URL or head back home.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22 }}>
          <button className="btn btn--outline" onClick={() => navigate(-1)}>Go back</button>
          <Link className="btn btn--ink" to="/">Return home</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
