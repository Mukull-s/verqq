import { Link } from 'react-router-dom';

const BrandMark = () => (
  <span className="brand__mark"><i></i><i></i><i></i><i></i></span>
);

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div>
          <Link className="brand" to="/">
            <BrandMark /> VerQ
          </Link>
          <p className="lead" style={{ fontSize: 14, maxWidth: 320, marginTop: 16 }}>
            Voice-first interview rehearsal for candidates who want to sound as capable as they are.
          </p>
        </div>

        <div>
          <h4>Product</h4>
          <Link to="/">Home</Link>
          <Link to="/my-interviews">Dashboard</Link>
          <Link to="/interview">Take Interview</Link>
        </div>

        <div>
          <h4>Get started</h4>
          <Link to="/register">Create account</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/interview">Start practising</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <a href="mailto:verqofficials@gmail.com">verqofficials@gmail.com</a>
        </div>
      </div>

      <div className="wrap" style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
        <p className="muted" style={{ fontSize: 13 }}>© {new Date().getFullYear()} VerQ. All rights reserved.</p>
        <p className="muted" style={{ fontSize: 13 }}>Privacy · Terms</p>
      </div>
    </footer>
  );
}

export default Footer;
