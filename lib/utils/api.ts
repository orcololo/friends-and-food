const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  register: (data: any) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => apiRequest('/auth/me'),

  // Users
  getUser: (id: string) => apiRequest(`/users/${id}`),
  updateUser: (id: string, data: any) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Places
  getPlaces: (params?: string) => apiRequest(`/places${params ? `?${params}` : ''}`),
  getPlace: (id: string) => apiRequest(`/places/${id}`),
  createPlace: (data: any) => apiRequest('/places', { method: 'POST', body: JSON.stringify(data) }),
  getNearbyPlaces: (lng: number, lat: number, maxDistance?: number) =>
    apiRequest(`/places/nearby?lng=${lng}&lat=${lat}${maxDistance ? `&maxDistance=${maxDistance}` : ''}`),

  // Events
  getEvents: (params?: string) => apiRequest(`/events${params ? `?${params}` : ''}`),
  getEvent: (id: string) => apiRequest(`/events/${id}`),
  createEvent: (data: any) => apiRequest('/events', { method: 'POST', body: JSON.stringify(data) }),
  attendEvent: (id: string) => apiRequest(`/events/${id}/attend`, { method: 'POST' }),
  unattendEvent: (id: string) => apiRequest(`/events/${id}/attend`, { method: 'DELETE' }),

  // Reviews
  createReview: (data: any) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Posts
  getPosts: (params?: string) => apiRequest(`/posts${params ? `?${params}` : ''}`),
  createPost: (data: any) => apiRequest('/posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
  unlikePost: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'DELETE' }),

  // Groups
  getGroups: () => apiRequest('/groups'),
  getGroup: (id: string) => apiRequest(`/groups/${id}`),
  createGroup: (data: any) => apiRequest('/groups', { method: 'POST', body: JSON.stringify(data) }),

  // Friends
  getFriends: () => apiRequest('/friends'),
  getFriendRequests: () => apiRequest('/friends/requests'),
  sendFriendRequest: (toUserId: string) => apiRequest('/friends', { method: 'POST', body: JSON.stringify({ toUserId }) }),
  acceptFriendRequest: (id: string) => apiRequest(`/friends/requests/${id}`, { method: 'PUT', body: JSON.stringify({ action: 'accept' }) }),
  rejectFriendRequest: (id: string) => apiRequest(`/friends/requests/${id}`, { method: 'PUT', body: JSON.stringify({ action: 'reject' }) }),
  removeFriend: (id: string) => apiRequest(`/friends/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: (params?: string) => apiRequest(`/notifications${params ? `?${params}` : ''}`),
  markNotificationRead: (id: string) => apiRequest(`/notifications/${id}`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/notifications/mark-all-read', { method: 'PUT' }),
  deleteNotification: (id: string) => apiRequest(`/notifications/${id}`, { method: 'DELETE' }),

  // Search
  search: (query: string, type?: string) => apiRequest(`/search?q=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`),
};
