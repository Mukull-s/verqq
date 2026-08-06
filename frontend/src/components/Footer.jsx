import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="w-full py-12 mt-20 border-t border-zinc-900 bg-[#070708]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <Link to="/" className="group">
              <span className="font-bold text-lg text-white group-hover:text-zinc-300 transition-colors">VerQ</span>
            </Link>
            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
              Your AI-powered interview preparation platform. Practice, improve, and excel in your interviews.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-medium text-xs text-zinc-400 uppercase tracking-widest">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/my-interviews" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/interview" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  Interview
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-medium text-xs text-zinc-400 uppercase tracking-widest">Contact</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a href="mailto:verqofficals@gmail.com" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                  verqofficals@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-zinc-900/60">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-zinc-650">
              © {new Date().getFullYear()} VerQ. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 