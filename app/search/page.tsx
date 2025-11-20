'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, User, MapPin, Calendar, Users, Star, X, Loader2 } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api } from '@/lib/utils/api';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/utils/animations';

type SearchType = 'all' | 'users' | 'places' | 'events' | 'groups';

interface SearchResults {
  users?: any[];
  places?: any[];
  events?: any[];
  groups?: any[];
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<SearchType>((searchParams.get('type') as SearchType) || 'all');
  const [results, setResults] = useState<SearchResults>({});
  const [counts, setCounts] = useState({ users: 0, places: 0, events: 0, groups: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Perform search if query exists in URL
    const queryParam = searchParams.get('q');
    if (queryParam) {
      performSearch(queryParam, searchType);
    }
  }, []);

  const performSearch = async (query: string, type: SearchType = 'all') => {
    if (!query || query.trim().length < 2) {
      showToast('Please enter at least 2 characters to search', 'warning');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await api.search(query.trim(), type === 'all' ? undefined : type);
      setResults(response.data.results);
      setCounts(response.data.counts);

      // Update URL without page reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('q', query.trim());
      newUrl.searchParams.set('type', type);
      window.history.pushState({}, '', newUrl);
    } catch (error: any) {
      showToast(error.message || 'Search failed', 'error');
      setResults({});
      setCounts({ users: 0, places: 0, events: 0, groups: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery, searchType);
  };

  const handleTypeChange = (type: SearchType) => {
    setSearchType(type);
    if (hasSearched) {
      performSearch(searchQuery, type);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults({});
    setCounts({ users: 0, places: 0, events: 0, groups: 0 });
    setHasSearched(false);
    window.history.pushState({}, '', '/search');
  };

  const getTotalResults = () => {
    return counts.users + counts.places + counts.events + counts.groups;
  };

  const filterTypes = [
    { value: 'all', label: 'All', icon: Search, count: getTotalResults() },
    { value: 'users', label: 'Users', icon: User, count: counts.users },
    { value: 'places', label: 'Places', icon: MapPin, count: counts.places },
    { value: 'events', label: 'Events', icon: Calendar, count: counts.events },
    { value: 'groups', label: 'Groups', icon: Users, count: counts.groups },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Search</h1>
            <p className="text-gray-600">Find people, places, events, and groups</p>
          </motion.div>

          {/* Search Bar */}
          <motion.div variants={staggerItem}>
            <Card>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for anything..."
                    className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <Button type="submit" className="w-full" isLoading={isSearching}>
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* Filter Tabs */}
          {hasSearched && (
            <motion.div variants={staggerItem}>
              <Card>
                <div className="flex flex-wrap gap-2">
                  {filterTypes.map((filter) => {
                    const Icon = filter.icon;
                    return (
                      <motion.button
                        key={filter.value}
                        onClick={() => handleTypeChange(filter.value as SearchType)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          searchType === filter.value
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{filter.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            searchType === filter.value
                              ? 'bg-white/20'
                              : 'bg-gray-200'
                          }`}
                        >
                          {filter.count}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Loading State */}
          {isSearching && (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center py-12"
            >
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
              <p className="text-gray-600">Searching...</p>
            </motion.div>
          )}

          {/* No Results */}
          {!isSearching && hasSearched && getTotalResults() === 0 && (
            <motion.div variants={fadeInUp}>
              <Card>
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try different keywords or search in a different category
                  </p>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Results */}
          {!isSearching && hasSearched && getTotalResults() > 0 && (
            <motion.div variants={staggerContainer} className="space-y-6">
              {/* Users Results */}
              {(searchType === 'all' || searchType === 'users') && results.users && results.users.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-6 h-6 mr-2 text-orange-500" />
                      Users ({results.users.length})
                    </h2>
                    <div className="space-y-3">
                      {results.users.map((user) => (
                        <motion.div
                          key={user._id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => router.push(`/profile/${user.username}`)}
                          className="flex items-center space-x-4 p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{user.name}</p>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            {user.bio && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{user.bio}</p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Places Results */}
              {(searchType === 'all' || searchType === 'places') && results.places && results.places.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                      <MapPin className="w-6 h-6 mr-2 text-orange-500" />
                      Places ({results.places.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.places.map((place) => (
                        <motion.div
                          key={place._id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => router.push(`/places/${place._id}`)}
                          className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-800 text-lg">{place.name}</h3>
                            {place.averageRating > 0 && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                <span className="text-sm font-medium">{place.averageRating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{place.cuisine}</p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {place.address}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Added by {place.createdBy?.name || 'Unknown'}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Events Results */}
              {(searchType === 'all' || searchType === 'events') && results.events && results.events.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                      Events ({results.events.length})
                    </h2>
                    <div className="space-y-3">
                      {results.events.map((event) => (
                        <motion.div
                          key={event._id}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => router.push(`/events/${event._id}`)}
                          className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                        >
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            {event.placeId?.name && (
                              <span className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {event.placeId.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Organized by {event.organizer?.name || 'Unknown'}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Groups Results */}
              {(searchType === 'all' || searchType === 'groups') && results.groups && results.groups.length > 0 && (
                <motion.div variants={staggerItem}>
                  <Card>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                      <Users className="w-6 h-6 mr-2 text-orange-500" />
                      Groups ({results.groups.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {results.groups.map((group) => (
                        <motion.div
                          key={group._id}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => router.push(`/groups/${group._id}`)}
                          className="p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-200"
                        >
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">{group.name}</h3>
                          {group.description && (
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">
                              {group.members?.length || 0} member{group.members?.length !== 1 ? 's' : ''}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                group.isPrivate
                                  ? 'bg-gray-200 text-gray-700'
                                  : 'bg-green-100 text-green-700'
                              }`}
                            >
                              {group.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            Created by {group.createdBy?.name || 'Unknown'}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Empty State - No Search Yet */}
          {!hasSearched && !isSearching && (
            <motion.div variants={fadeInUp}>
              <Card>
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Start your search
                  </h3>
                  <p className="text-gray-600">
                    Enter a keyword to find users, places, events, or groups
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
