'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, UtensilsCrossed, Calendar, Users } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<any>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/auth/login');
  };

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/places', label: 'Places', icon: UtensilsCrossed },
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/groups', label: 'Groups', icon: Users },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-2">
            <UtensilsCrossed className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold text-orange-500">Friends & Food</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                      pathname === link.href
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    {link.label}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />

            <Link href={user ? `/profile/${user.username}` : '/profile'}>
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:bg-orange-600 transition-colors">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
