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
  getPlaces: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return apiRequest(`/places${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getPlace: (id: string) => apiRequest(`/places/${id}`),
  createPlace: (data: any) => apiRequest('/places', { method: 'POST', body: JSON.stringify(data) }),
  updatePlace: (id: string, data: any) => apiRequest(`/places/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlace: (id: string) => apiRequest(`/places/${id}`, { method: 'DELETE' }),
  getNearbyPlaces: (lng: number, lat: number, maxDistance?: number) =>
    apiRequest(`/places/nearby?lng=${lng}&lat=${lat}${maxDistance ? `&maxDistance=${maxDistance}` : ''}`),

  // Events
  getEvents: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return apiRequest(`/events${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getEvent: (id: string) => apiRequest(`/events/${id}`),
  createEvent: (data: any) => apiRequest('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: string, data: any) => apiRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: (id: string) => apiRequest(`/events/${id}`, { method: 'DELETE' }),
  attendEvent: (id: string) => apiRequest(`/events/${id}/attend`, { method: 'POST' }),
  unattendEvent: (id: string) => apiRequest(`/events/${id}/attend`, { method: 'DELETE' }),
  getEventComments: (id: string) => apiRequest(`/events/${id}/comments`),
  addEventComment: (id: string, content: string) => apiRequest(`/events/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Reviews
  createReview: (data: any) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Posts
  getPosts: (params?: string) => apiRequest(`/posts${params ? `?${params}` : ''}`),
  createPost: (data: any) => apiRequest('/posts', { method: 'POST', body: JSON.stringify(data) }),
  likePost: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'POST' }),
  unlikePost: (id: string) => apiRequest(`/posts/${id}/like`, { method: 'DELETE' }),
  getPostComments: (id: string) => apiRequest(`/posts/${id}/comments`),
  addPostComment: (id: string, content: string) => apiRequest(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),

  // Groups
  getGroups: (page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    return apiRequest(`/groups${params.toString() ? `?${params.toString()}` : ''}`);
  },
  getGroup: (id: string) => apiRequest(`/groups/${id}`),
  createGroup: (data: any) => apiRequest('/groups', { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (id: string, data: any) => apiRequest(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteGroup: (id: string) => apiRequest(`/groups/${id}`, { method: 'DELETE' }),

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
