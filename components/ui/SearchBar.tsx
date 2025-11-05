'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, User, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { api } from '@/lib/utils/api';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search(query);
        setResults(data.data.results);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleResultClick = (type: string, id: string, username?: string) => {
    setQuery('');
    setResults(null);
    setIsOpen(false);

    if (type === 'users') {
      router.push(`/profile/${username}`);
    } else if (type === 'places') {
      router.push(`/places/${id}`);
    } else if (type === 'events') {
      router.push(`/events/${id}`);
    } else if (type === 'groups') {
      router.push(`/groups/${id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'users':
        return <User className="w-4 h-4" />;
      case 'places':
        return <MapPin className="w-4 h-4" />;
      case 'events':
        return <Calendar className="w-4 h-4" />;
      case 'groups':
        return <Users className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const hasResults = results && (
    (results.users?.length > 0) ||
    (results.places?.length > 0) ||
    (results.events?.length > 0) ||
    (results.groups?.length > 0)
  );

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, places, events..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin" />
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50"
          >
            {!hasResults && !isLoading && (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No results found for "{query}"
              </div>
            )}

            {hasResults && (
              <div className="py-2">
                {/* Users */}
                {results.users && results.users.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Users
                    </div>
                    {results.users.map((user: any) => (
                      <button
                        key={user._id}
                        onClick={() => handleResultClick('users', user._id, user.username)}
                        className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getIcon('users')}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Places */}
                {results.places && results.places.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Places
                    </div>
                    {results.places.map((place: any) => (
                      <button
                        key={place._id}
                        onClick={() => handleResultClick('places', place._id)}
                        className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getIcon('places')}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{place.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{place.cuisine}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Events */}
                {results.events && results.events.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Events
                    </div>
                    {results.events.map((event: any) => (
                      <button
                        key={event._id}
                        onClick={() => handleResultClick('events', event._id)}
                        className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getIcon('events')}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Groups */}
                {results.groups && results.groups.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                      Groups
                    </div>
                    {results.groups.map((group: any) => (
                      <button
                        key={group._id}
                        onClick={() => handleResultClick('groups', group._id)}
                        className="w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 transition-colors"
                      >
                        <div className="flex-shrink-0">
                          {getIcon('groups')}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900 dark:text-white">{group.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {group.members?.length || 0} members
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
