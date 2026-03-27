import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Camera, LayoutDashboard } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authService } from '../services/api';
import { useProfile } from '../context/ProfileContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Portfolio', path: '/portfolio' },
  { name: 'Videos', path: '/videos' },
  { name: 'About', path: '/about' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { profile } = useProfile();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const brandName = profile?.websiteName?.toUpperCase() || profile?.name?.split(' ')[1]?.toUpperCase() || 'LUMINA';

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-700 px-6 py-4',
        scrolled ? 'translate-y-0' : 'translate-y-2'
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto flex items-center justify-between transition-all duration-700 px-6 py-3 bg-black rounded-2xl border",
        scrolled ? "shadow-2xl shadow-black/50 border-white/10" : "border-white/5"
      )}>
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Camera className="w-6 h-6 text-white" />
            )}
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'text-[10px] font-medium tracking-[0.3em] uppercase transition-colors hover:text-indigo-400',
                location.pathname === link.path ? 'text-indigo-500' : 'text-zinc-400'
              )}
            >
              {link.name}
            </Link>
          ))}
          {authService.isAuthenticated() && (
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-2 text-[10px] font-medium tracking-[0.3em] uppercase text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          )}
          <Link to="/contact" className="btn-primary py-2 px-6 text-[10px] uppercase tracking-widest">
            Book Now
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-6 right-6 mt-4 bg-black border border-white/10 rounded-2xl p-8 md:hidden flex flex-col gap-6 shadow-2xl"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'text-sm font-medium tracking-widest uppercase',
                  location.pathname === link.path ? 'text-indigo-500' : 'text-zinc-400'
                )}
              >
                {link.name}
              </Link>
            ))}
            {authService.isAuthenticated() && (
              <Link
                to="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="text-sm font-medium tracking-widest uppercase text-indigo-500 flex items-center gap-3"
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            )}
            <Link to="/contact" onClick={() => setIsOpen(false)} className="btn-primary py-4 text-center text-sm uppercase tracking-widest">
              Book Now
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
