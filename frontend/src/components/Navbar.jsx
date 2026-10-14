import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import profileImage from '../assets/images/profile.png';

const BrandMark = () => (
  <span className="brand__mark"><i></i><i></i><i></i><i></i></span>
);

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => (location.pathname === path ? 'aria-current="page"' : undefined);

  const handleSignOut = async () => {
    try {
      await logout();
      setProfileOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const initials = (user?.displayName || user?.email || 'VQ')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="topbar">
      <nav className="nav">
        <Link className="brand" to="/">
          <BrandMark /> VerQ
        </Link>

        <div className="nav__links">
          <Link to="/" {...(isActive('/') ? { 'aria-current': 'page' } : {})}>Home</Link>
          <Link to="/my-interviews" {...(isActive('/my-interviews') ? { 'aria-current': 'page' } : {})}>Dashboard</Link>
          <Link to="/interview" {...(isActive('/interview') ? { 'aria-current': 'page' } : {})}>Take Interview</Link>
        </div>

        <div className="nav__right">
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setProfileOpen((v) => !v)} className="icon-btn" aria-label="Account menu">
              <img src={user?.photoURL || profileImage} alt="" className="w-full h-full rounded-full object-cover" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-60 rounded-2xl p-2"
                   style={{ background: 'var(--surface)', border: '1px solid var(--line)', boxShadow: 'var(--sh-md)' }}>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="brand__mark" style={{ width: 36, height: 36, borderRadius: 11, fontSize: 12, color: '#EAF0F4' }}>{initials}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>{user?.displayName || 'Candidate'}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--ink-3)' }}>{user?.email || ''}</p>
                  </div>
                </div>
                <div className="hair my-1" />
                <Link to="/my-interviews" className="block px-3 py-2 text-sm rounded-xl hover:bg-[var(--surface-2)]" style={{ color: 'var(--ink-2)' }}>My Interviews</Link>
                <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm rounded-xl hover:bg-[var(--rose-soft)]" style={{ color: 'var(--rose)' }}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
