import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogIn, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Panditji', href: '/panditji' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Events', href: '/events' },
  { name: 'Live', href: '/live' },
  { name: 'Donations', href: '/donations' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, profile, signOut, isAdmin } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-saffron flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg lg:text-xl">ॐ</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-heading text-lg lg:text-xl font-semibold text-foreground">
                Brahmin Samaj
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Community Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.href
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">Admin</Button>
                  </Link>
                )}
                <Link to="/my-bookings">
                  <Button variant="ghost" size="sm">
                    <CalendarCheck className="w-4 h-4 mr-1" />
                    My Bookings
                  </Button>
                </Link>
                <div className="text-right">
                  <p className="text-sm font-medium">{profile?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {profile?.verification_status === 'verified' ? '✓ Verified' : profile?.verification_status}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border"
            >
              <div className="py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all ${
                      location.pathname === link.href
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 px-4 space-y-2 border-t border-border mt-4">
                  {isAuthenticated ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Logged in as <span className="font-medium text-foreground">{profile?.name}</span>
                      </p>
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full mb-2">Admin Dashboard</Button>
                        </Link>
                      )}
                      <Link to="/my-bookings" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full mb-2">
                          <CalendarCheck className="w-4 h-4 mr-2" />
                          My Bookings
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full" onClick={() => { signOut(); setIsOpen(false); }}>
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full">Login</Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <Button variant="hero" className="w-full">Register</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}