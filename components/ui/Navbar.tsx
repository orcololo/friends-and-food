'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll } from 'framer-motion';
import { Home, Map, UtensilsCrossed, Calendar, Users, Menu, X, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { scrollY } = useScroll();

  React.useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (data.success) {
            setUser(data.data);
          }
        } catch (error) {
          console.error('Failed to load user:', error);
        }
      }
    };
    loadUser();
  }, []);

  React.useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 20);
    });
  }, [scrollY]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/places', label: 'Places', icon: UtensilsCrossed },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/groups', label: 'Groups', icon: Users },
  ];

  return (
    <>
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange-500 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg'
            : 'bg-white dark:bg-gray-900 shadow-md'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 group" aria-label="Friends & Food Home">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Friends & Food
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative px-4 py-2 rounded-lg transition-colors flex items-center group"
                  >
                    <IconComponent className={`w-5 h-5 mr-2 transition-colors ${
                      isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300 group-hover:text-orange-500'
                    }`} />
                    <span className={`transition-colors ${
                      isActive ? 'text-white' : 'text-gray-700 dark:text-gray-300 group-hover:text-orange-500'
                    }`}>
                      {link.label}
                    </span>
                    {/* Animated background */}
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            {/* Search Button - 44x44px touch target */}
            <Link href="/search">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Search"
              >
                <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </motion.button>
            </Link>

            <ThemeToggle />
            <NotificationBell />

            {/* User Avatar - 44x44px touch target */}
            <Link href={user ? `/profile/${user.username}` : '/profile'} aria-label={user ? `View profile for ${user.name}` : 'View profile'}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-11 h-11 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
              >
                {user?.name?.charAt(0) || 'U'}
              </motion.div>
            </Link>

            {/* Mobile Menu Button - 44x44px touch target */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-16 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-2xl md:hidden overflow-y-auto max-h-[calc(100vh-4rem)]"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="p-4 space-y-2">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm md:hidden z-[-1]"
          />
        )}
      </AnimatePresence>
      </motion.nav>
    </>
  );
}
