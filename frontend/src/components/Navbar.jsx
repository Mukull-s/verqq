import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import profileImage from '../assets/images/profile.png';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewport, setViewport] = useState('desktop');
  const { darkMode, toggleTheme } = useTheme();
  const { user: userData, logout } = useAuth();
  const profileDropdownRef = useRef(null);
  
  // Check viewport size
  useEffect(() => {
    const checkViewport = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewport('mobile');
      } else if (width < 1024) {
        setViewport('tablet');
      } else {
        setViewport('desktop');
      }
    };
    
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    return () => {
      window.removeEventListener('resize', checkViewport);
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdownRef]);
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (profileOpen) setProfileOpen(false);
  };
  
  const toggleProfile = () => {
    setProfileOpen(!profileOpen);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setProfileOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Profile dropdown component
  const ProfileDropdown = () => (
    <div className={`absolute right-0 top-full mt-2 p-4 rounded-lg shadow-xl border border-zinc-850 w-[240px] ${profileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} bg-[#0C0C0E]/95 backdrop-blur-xl`}>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <img 
            src={userData?.photoURL || profileImage} 
            alt="Profile" 
            className="w-9 h-9 rounded-full object-cover border border-zinc-800"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm text-zinc-200 truncate">{userData?.displayName || 'Guest'}</h3>
            <p className="text-xs text-zinc-500 truncate" title={userData?.email || ''}>{userData?.email || ''}</p>
            {userData?.providerData?.[0]?.providerId === 'github.com' && (
              <a 
                href={`https://github.com/${userData?.providerData?.[0]?.uid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 mt-1 font-medium transition-colors"
              >
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                <span className="truncate">GitHub Profile</span>
              </a>
            )}
          </div>
        </div>
        
        <div className="border-t border-zinc-850 pt-2.5 space-y-1">
          <Link 
            to="/my-interviews"
            className="block w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 rounded-md transition-colors"
            onClick={() => setProfileOpen(false)}
          >
            My Interviews
          </Link>
          <button 
            onClick={handleSignOut}
            className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/20 rounded-md transition-colors font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // Mobile menu component
  const MobileMenu = () => (
    <div className={`absolute top-[70px] right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 ${menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <ul className="flex flex-col space-y-3 font-montserrat font-semibold text-sm">
        <li>
          <Link 
            to="/" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            to="/my-interviews" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/my-interviews') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link 
            to="/interview" 
            className={`block px-4 py-2 rounded-full ${
              isActive('/interview') 
                ? 'bg-black/10 dark:bg-white/10 text-gray-900 dark:text-gray-100' 
                : 'text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5'
            }`}
            onClick={() => setMenuOpen(false)}
          >
            Take Interview
          </Link>
        </li>
      </ul>
    </div>
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center w-full mt-4">
      <nav className={`flex items-center px-6 h-[56px] relative
        ${viewport !== 'desktop'
          ? 'w-[95vw] bg-[#09090B]/85 backdrop-blur-md rounded-full border border-zinc-850 justify-between' 
          : 'w-[75vw] bg-[#09090B]/85 backdrop-blur-md rounded-full border border-zinc-850 justify-between'
        }`}>
        {/* Left section - Logo */}
        <div className="flex flex-col justify-center">
          <Link to="/" className="group">
            <span className="font-bold text-lg tracking-tight text-white group-hover:text-zinc-300 transition-colors">VerQ</span>
          </Link>
        </div>
        
        {/* Middle section - Navigation pills - Centered with absolute positioning */}
        {viewport !== 'mobile' && (
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <div className="bg-[#0C0C0E]/40 backdrop-blur-md rounded-full inline-flex items-center border border-zinc-850 p-0.5">
              <ul className="flex font-medium text-xs items-center">
                <li className="flex items-center">
                  <Link 
                    to="/" 
                    className={`inline-block px-3 py-1.5 rounded-full transition-all duration-150 ${
                      isActive('/') 
                        ? 'bg-zinc-800 text-white shadow-sm font-semibold' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Home
                  </Link>
                </li>
                <li className="flex items-center">
                  <Link 
                    to="/my-interviews" 
                    className={`inline-block px-3 py-1.5 rounded-full transition-all duration-150 ${
                      isActive('/my-interviews') 
                        ? 'bg-zinc-800 text-white shadow-sm font-semibold' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="flex items-center">
                  <Link 
                    to="/interview" 
                    className={`inline-block px-3 py-1.5 rounded-full transition-all duration-150 ${
                      isActive('/interview') 
                        ? 'bg-zinc-800 text-white shadow-sm font-semibold' 
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Take Interview
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        )}
        
        {/* Right section - Profile and Mobile Menu */}
        <div className="flex items-center space-x-2">
          {/* Profile button - Always visible */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={toggleProfile}
              className="flex items-center space-x-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                <img 
                  src={profileImage} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
            <ProfileDropdown />
          </div>

          {/* Mobile menu button - Only visible on mobile */}
          {viewport === 'mobile' && (
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800 dark:text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Mobile Menu */}
        {viewport === 'mobile' && <MobileMenu />}
      </nav>
    </div>
  );
}

export default Navbar; 