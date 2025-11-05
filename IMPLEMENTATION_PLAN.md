# Friends & Food - Feature Implementation Plan

## Overview
This document outlines the implementation plan for new features to enhance the Friends & Food social restaurant planning app. Features are organized by priority, complexity, and estimated implementation time.

---

## 🎯 Phase 1: Essential User Controls (High Priority)

### 1.1 Delete Posts & Comments
**Estimated Time:** 45-60 minutes
**Complexity:** Easy
**Priority:** High

**Why:** Users expect to be able to delete their own content. This is a standard social media feature.

**Implementation:**
- **Backend:**
  - Create `DELETE /api/posts/[id]` endpoint
  - Check ownership: `req.user.userId === post.userId`
  - Delete post and cascade delete comments
  - Create `DELETE /api/posts/[id]/comments/[commentId]` endpoint

- **Frontend:**
  - Add "Delete" button (trash icon) visible only to post/comment owner
  - Confirmation modal: "Are you sure you want to delete this post?"
  - Optimistic UI: Remove from list immediately
  - Toast notification: "Post deleted successfully"
  - Add to dashboard and profile pages

**Files to Modify:**
- `app/api/posts/[id]/route.ts` - Add DELETE handler
- `app/api/posts/[id]/comments/[commentId]/route.ts` - New file for comment deletion
- `app/dashboard/page.tsx` - Add delete button and handler
- `app/profile/[username]/page.tsx` - Add delete button and handler
- `lib/utils/api.ts` - Add `deletePost()` and `deletePostComment()` methods

**Technical Considerations:**
- Use `{ onDelete: 'cascade' }` or manually delete comments when post is deleted
- Check user ownership before deletion
- Handle edge cases: post already deleted, permission denied

---

### 1.2 Edit Posts
**Estimated Time:** 60-90 minutes
**Complexity:** Medium
**Priority:** Medium-High

**Why:** Users make typos or want to clarify posts. Time-limited editing prevents abuse.

**Implementation:**
- **Backend:**
  - Create `PUT /api/posts/[id]` endpoint
  - Check ownership and time limit (15 minutes)
  - Add `editedAt` field to Post model
  - Validate: content required, max length 1000 chars

- **Frontend:**
  - "Edit" button visible for 15 min after posting
  - Reuse create post modal with pre-filled content
  - Show "Edited" badge on modified posts
  - Character counter during editing
  - Save button with loading state

**Files to Modify:**
- `lib/models/Post.ts` - Add optional `editedAt: Date` field
- `app/api/posts/[id]/route.ts` - Add PUT handler
- `app/dashboard/page.tsx` - Add edit modal and logic
- `app/profile/[username]/page.tsx` - Add edit modal and logic
- `lib/utils/api.ts` - Add `updatePost(id, data)` method

**Technical Considerations:**
```typescript
// Check if editable (within 15 minutes)
const fifteenMinutes = 15 * 60 * 1000;
const isEditable = Date.now() - new Date(post.createdAt).getTime() < fifteenMinutes;

// In Post model
editedAt: {
  type: Date,
  default: null,
}
```

---

### 1.3 Share Posts
**Estimated Time:** 30 minutes
**Complexity:** Easy
**Priority:** Medium

**Why:** Increases engagement and viral potential. Easy to implement with native APIs.

**Implementation:**
- **Frontend Only:**
  - Add "Share" button (Share2 icon) on each post
  - Use `navigator.share()` for mobile devices
  - Fallback: Copy link to clipboard
  - Generate shareable URL: `/posts/[postId]` (optional post detail page)
  - Toast: "Link copied!" or use native share dialog

**Files to Modify:**
- `app/dashboard/page.tsx` - Add share button and handler
- `app/profile/[username]/page.tsx` - Add share button and handler

**Code Example:**
```typescript
const handleSharePost = async (postId: string) => {
  const url = `${window.location.origin}/posts/${postId}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Check out this post on Friends & Food',
        text: post.content.substring(0, 100) + '...',
        url: url,
      });
    } catch (err) {
      // User cancelled
    }
  } else {
    await navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!', 'success');
  }
};
```

**Optional Enhancement:**
- Create `/app/posts/[id]/page.tsx` for dedicated post view with Open Graph meta tags

---

## 🔖 Phase 2: Discovery & Organization (Medium Priority)

### 2.1 Bookmark/Save Places
**Estimated Time:** 90-120 minutes
**Complexity:** Medium
**Priority:** High

**Why:** Users want to save places they're interested in for later. Core functionality for discovery apps.

**Implementation:**
- **Backend:**
  - Create SavedPlace model: `{ userId, placeId, savedAt }`
  - Create `POST /api/places/[id]/save` endpoint
  - Create `DELETE /api/places/[id]/save` endpoint
  - Create `GET /api/saved-places` endpoint (paginated)

- **Frontend:**
  - Bookmark icon on place cards (filled when saved)
  - Optimistic UI toggle
  - "Saved Places" tab on profile page
  - Grid view of saved places
  - Unsave button on saved places

**Files to Create:**
- `lib/models/SavedPlace.ts` - New model
- `app/api/places/[id]/save/route.ts` - Save/unsave endpoints
- `app/api/saved-places/route.ts` - List saved places

**Files to Modify:**
- `app/places/page.tsx` - Add bookmark button
- `app/places/[id]/page.tsx` - Add bookmark button
- `app/profile/[username]/page.tsx` - Add "Saved Places" tab
- `lib/utils/api.ts` - Add save/unsave methods

**Model Schema:**
```typescript
const SavedPlaceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  placeId: { type: Schema.Types.ObjectId, ref: 'Place', required: true },
  savedAt: { type: Date, default: Date.now },
});

// Unique constraint: one save per user per place
SavedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });
```

---

### 2.2 Filter & Sort Places
**Estimated Time:** 60 minutes
**Complexity:** Easy
**Priority:** Medium

**Why:** Helps users find exactly what they're looking for. Improves discoverability.

**Implementation:**
- **Frontend Only (Client-side):**
  - Add filter dropdowns for: Cuisine, Price Range, Min Rating
  - Add sort dropdown: Rating (High-Low), Rating (Low-High), Price (Low-High), Price (High-Low), Newest, Oldest
  - Filter and sort in-memory after API fetch
  - Persist filters to URL query params (optional)

**Files to Modify:**
- `app/places/page.tsx` - Add filter UI and logic

**UI Design:**
```typescript
// Filter state
const [filters, setFilters] = useState({
  cuisine: 'all',
  priceRange: 'all',
  minRating: 0,
});

const [sortBy, setSortBy] = useState('rating-desc');

// Apply filters and sort
const filteredPlaces = places
  .filter(place => {
    if (filters.cuisine !== 'all' && place.cuisine !== filters.cuisine) return false;
    if (filters.priceRange !== 'all' && place.priceRange !== parseInt(filters.priceRange)) return false;
    if (place.averageRating < filters.minRating) return false;
    return true;
  })
  .sort((a, b) => {
    switch (sortBy) {
      case 'rating-desc': return b.averageRating - a.averageRating;
      case 'rating-asc': return a.averageRating - b.averageRating;
      case 'price-asc': return a.priceRange - b.priceRange;
      case 'price-desc': return b.priceRange - a.priceRange;
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default: return 0;
    }
  });
```

---

### 2.3 Search Places
**Estimated Time:** 45 minutes
**Complexity:** Easy
**Priority:** Medium

**Why:** Quick way to find specific restaurants by name or keyword.

**Implementation:**
- **Frontend:**
  - Add search input at top of places page
  - Debounced search (wait 300ms after typing stops)
  - Filter places by name or description containing search term
  - Show "No results" message when empty
  - Clear search button

**Files to Modify:**
- `app/places/page.tsx` - Add search input and logic

**Code Example:**
```typescript
const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

// Debounce search
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Filter by search
const searchedPlaces = filteredPlaces.filter(place =>
  place.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
  place.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
);
```

---

### 2.4 Trending Places
**Estimated Time:** 60 minutes
**Complexity:** Medium
**Priority:** Low-Medium

**Why:** Highlights popular places, increases engagement, helps discovery.

**Implementation:**
- **Backend:**
  - Create `GET /api/places/trending` endpoint
  - Query places with most reviews/check-ins in last 7 days
  - Return top 6 places

- **Frontend:**
  - "🔥 Trending This Week" section on dashboard or places page
  - Horizontal scrollable carousel
  - Small place cards with trending badge

**Files to Create:**
- `app/api/places/trending/route.ts` - Trending endpoint

**Files to Modify:**
- `app/dashboard/page.tsx` or `app/places/page.tsx` - Add trending section
- `lib/utils/api.ts` - Add `getTrendingPlaces()` method

**Query Logic:**
```typescript
// Get places with most recent activity
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const trendingPlaces = await Review.aggregate([
  { $match: { createdAt: { $gte: sevenDaysAgo } } },
  { $group: { _id: '$placeId', count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 6 },
  { $lookup: { from: 'places', localField: '_id', foreignField: '_id', as: 'place' } },
  { $unwind: '$place' },
]);
```

---

## 🎨 Phase 3: Visual Enhancements (Medium Priority)

### 3.1 Dark Mode
**Estimated Time:** 90-120 minutes
**Complexity:** Medium
**Priority:** High (User request frequency)

**Why:** Reduces eye strain, saves battery on OLED screens, trendy feature users expect.

**Implementation:**
- **Setup:**
  - Create ThemeContext for dark mode state
  - Add `dark:` variants to Tailwind classes throughout app
  - Persist preference to localStorage
  - Detect system preference on first load

- **UI:**
  - Toggle button in navbar (Sun/Moon icon)
  - Smooth transition between themes
  - Update all pages with dark mode classes

**Files to Create:**
- `lib/contexts/ThemeContext.tsx` - Theme provider

**Files to Modify:**
- `app/layout.tsx` - Wrap with ThemeProvider, add `dark` class to html
- `components/ui/Navbar.tsx` - Add theme toggle button
- All page components - Add `dark:` classes to tailwind

**Context Example:**
```typescript
// ThemeContext.tsx
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(stored as 'light' | 'dark' || systemPreference);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

**Tailwind Classes to Add:**
```typescript
// Example conversions
bg-white -> bg-white dark:bg-gray-900
text-gray-800 -> text-gray-800 dark:text-gray-100
bg-gray-50 -> bg-gray-50 dark:bg-gray-800
border-gray-200 -> border-gray-200 dark:border-gray-700
```

---

### 3.2 Image Gallery/Lightbox
**Estimated Time:** 60 minutes
**Complexity:** Medium
**Priority:** Medium

**Why:** Better image viewing experience, professional polish.

**Implementation:**
- **Option A - Library:**
  - Install `yet-another-react-lightbox`
  - Wrap images with lightbox component
  - Add navigation arrows, zoom, close button

- **Option B - Custom:**
  - Create modal with full-screen image
  - Add swipe gestures for mobile
  - Arrow navigation for multiple images

**Files to Modify:**
- `app/places/[id]/page.tsx` - Wrap place images
- Review images - Add lightbox to review image displays

**Code Example (Custom):**
```typescript
const [lightboxOpen, setLightboxOpen] = useState(false);
const [currentImageIndex, setCurrentImageIndex] = useState(0);

<Modal isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} size="full">
  <div className="relative h-screen flex items-center justify-center bg-black">
    <img src={images[currentImageIndex]} alt="" className="max-h-full max-w-full" />
    <button onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}>
      Previous
    </button>
    <button onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}>
      Next
    </button>
  </div>
</Modal>
```

---

### 3.3 Profile Statistics & Badges
**Estimated Time:** 90 minutes
**Complexity:** Medium
**Priority:** Low-Medium

**Why:** Gamification increases engagement. Users like seeing their stats.

**Implementation:**
- **Backend:**
  - Create `GET /api/users/[username]/stats` endpoint
  - Calculate: total likes received, comments made, places visited, events attended
  - Award badges based on thresholds

- **Frontend:**
  - Stats cards on profile page
  - Use existing AnimatedCounter component
  - Badge display with icons
  - Hover to see badge requirements

**Files to Create:**
- `app/api/users/[username]/stats/route.ts` - Stats endpoint

**Files to Modify:**
- `app/profile/[username]/page.tsx` - Add stats section

**Badge System:**
```typescript
const badges = [
  { id: 'social-butterfly', name: 'Social Butterfly', icon: '🦋', requirement: '50+ posts', threshold: 50 },
  { id: 'foodie-expert', name: 'Foodie Expert', icon: '🍕', requirement: '25+ reviews', threshold: 25 },
  { id: 'party-planner', name: 'Party Planner', icon: '🎉', requirement: '10+ events organized', threshold: 10 },
  { id: 'trendsetter', name: 'Trendsetter', icon: '⭐', requirement: '100+ likes received', threshold: 100 },
];

// Check which badges user has earned
const earnedBadges = badges.filter(badge => userStats[badge.type] >= badge.threshold);
```

---

### 3.4 Loading Skeletons
**Estimated Time:** 60 minutes
**Complexity:** Easy
**Priority:** Medium

**Why:** App feels faster with skeleton screens. Better perceived performance.

**Implementation:**
- **Frontend:**
  - Reuse existing `skeletonPulse` animation
  - Create skeleton components for: PlaceCard, PostCard, EventCard, ReviewCard
  - Show skeletons while `isLoading === true`
  - Match skeleton shape to actual content

**Files to Modify:**
- `app/places/page.tsx` - Already has skeletons ✅
- `app/events/page.tsx` - Add skeleton cards
- `app/dashboard/page.tsx` - Add skeleton posts
- `app/groups/page.tsx` - Add skeleton cards

**Skeleton Component Example:**
```typescript
const PostSkeleton = () => (
  <Card>
    <motion.div variants={skeletonPulse} initial="initial" animate="animate" className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-20" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </motion.div>
  </Card>
);
```

---

## 🔔 Phase 4: Notifications & Convenience (Low Priority)

### 4.1 Notification Badge & Mark All Read
**Estimated Time:** 30 minutes
**Complexity:** Easy
**Priority:** Medium

**Why:** Visual indicator for unread notifications. API already exists!

**Implementation:**
- **Frontend:**
  - Add red badge dot to bell icon in navbar
  - Display unread count in badge
  - "Mark All as Read" button in notifications dropdown
  - Update badge count on mark as read

**Files to Modify:**
- `components/ui/Navbar.tsx` - Add badge to bell icon
- Notifications page/dropdown - Add "Mark All as Read" button
- `lib/utils/api.ts` - Already has `markAllNotificationsRead()` ✅

**Badge UI:**
```typescript
<div className="relative">
  <Bell className="w-6 h-6" />
  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )}
</div>
```

---

### 4.2 User Mentions
**Estimated Time:** 120-180 minutes
**Complexity:** Hard
**Priority:** Low-Medium

**Why:** Increases engagement, helps users connect, standard social feature.

**Implementation:**
- **Backend:**
  - Parse post/comment content for `@username` patterns
  - Validate mentioned users exist
  - Create notifications for mentioned users
  - Store mentions in array field

- **Frontend:**
  - Autocomplete dropdown while typing `@`
  - Search users by username
  - Clickable mention links to profile
  - Highlight mentions in blue

**Files to Modify:**
- `lib/models/Post.ts` - Add `mentions: [ObjectId]` field
- Post/Comment creation logic - Parse and save mentions
- Text rendering - Convert @username to links
- `components/ui/MentionInput.tsx` - New component with autocomplete

**Parsing Logic:**
```typescript
// Extract mentions from text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  return Array.from(matches, m => m[1]);
};

// Validate and get user IDs
const mentionedUsernames = extractMentions(content);
const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } });
const mentionedIds = mentionedUsers.map(u => u._id);

// Create notifications
for (const userId of mentionedIds) {
  await Notification.create({
    userId,
    type: 'mention',
    message: `${currentUser.name} mentioned you in a post`,
    link: `/posts/${postId}`,
  });
}
```

---

### 4.3 Export Event to Calendar
**Estimated Time:** 45 minutes
**Complexity:** Easy
**Priority:** Low

**Why:** Helps users remember events, professional touch.

**Implementation:**
- **Frontend Only:**
  - "Add to Calendar" button on event detail page
  - Generate .ics file with event details
  - Trigger download or provide calendar links

- **Library:** Use `ics` npm package to generate .ics files

**Files to Modify:**
- `app/events/[id]/page.tsx` - Add calendar export button

**Code Example:**
```typescript
import { createEvent } from 'ics';

const handleExportCalendar = () => {
  const event = {
    start: [year, month, day, hour, minute],
    duration: { hours: 2 },
    title: eventData.title,
    description: eventData.description,
    location: eventData.placeId?.address,
    url: window.location.href,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  createEvent(event, (error, value) => {
    if (error) return;

    const blob = new Blob([value], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventData.title}.ics`;
    link.click();
  });
};
```

---

### 4.4 Copy Location Coordinates & Map Link
**Estimated Time:** 15 minutes
**Complexity:** Easy
**Priority:** Low

**Why:** Helps users navigate to places quickly.

**Implementation:**
- **Frontend:**
  - "Open in Maps" button on place detail
  - Generate Google Maps URL with coordinates
  - Copy coordinates button (optional)

**Files to Modify:**
- `app/places/[id]/page.tsx` - Add map buttons

**Code Example:**
```typescript
const handleOpenInMaps = () => {
  const [lng, lat] = place.location.coordinates;
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  window.open(url, '_blank');
};

const handleCopyCoordinates = () => {
  const [lng, lat] = place.location.coordinates;
  navigator.clipboard.writeText(`${lat}, ${lng}`);
  showToast('Coordinates copied!', 'success');
};
```

---

## 📊 Implementation Priority Matrix

| Feature | Impact | Effort | Priority | Time |
|---------|--------|--------|----------|------|
| Delete Posts/Comments | High | Low | **P0** | 1h |
| Bookmark Places | High | Medium | **P0** | 2h |
| Dark Mode | High | Medium | **P0** | 2h |
| Share Posts | Medium | Low | **P1** | 30m |
| Filter/Sort Places | High | Low | **P1** | 1h |
| Notification Badge | Medium | Low | **P1** | 30m |
| Edit Posts | Medium | Medium | **P2** | 1.5h |
| Search Places | Medium | Low | **P2** | 45m |
| Loading Skeletons | Medium | Low | **P2** | 1h |
| Image Lightbox | Medium | Medium | **P2** | 1h |
| Trending Places | Medium | Medium | **P3** | 1h |
| Profile Stats | Low | Medium | **P3** | 1.5h |
| Calendar Export | Low | Low | **P3** | 45m |
| User Mentions | Medium | High | **P4** | 3h |
| Copy Map Link | Low | Low | **P4** | 15m |

**Priority Levels:**
- **P0** = Critical, implement ASAP
- **P1** = High priority, implement this week
- **P2** = Medium priority, implement this sprint
- **P3** = Nice to have, implement when time permits
- **P4** = Low priority, backlog

---

## 🚀 Recommended Implementation Order

### Sprint 1 (Week 1) - Core User Controls
1. Delete Posts/Comments (1h)
2. Bookmark Places (2h)
3. Share Posts (30m)
4. Notification Badge + Mark All Read (30m)

**Total: ~4 hours**

### Sprint 2 (Week 2) - Discovery & UX
1. Dark Mode (2h)
2. Filter/Sort Places (1h)
3. Search Places (45m)
4. Loading Skeletons (1h)

**Total: ~5 hours**

### Sprint 3 (Week 3) - Polish & Enhancements
1. Edit Posts (1.5h)
2. Image Lightbox (1h)
3. Trending Places (1h)
4. Calendar Export (45m)

**Total: ~4 hours**

### Sprint 4 (Week 4) - Advanced Features
1. Profile Stats & Badges (1.5h)
2. User Mentions (3h)
3. Copy Map Link (15m)

**Total: ~5 hours**

---

## 📝 Implementation Notes

### Testing Checklist
For each feature, ensure:
- ✅ Feature works for post owner/creator
- ✅ Feature respects permissions (can't delete others' content)
- ✅ Error handling with toast notifications
- ✅ Loading states are shown
- ✅ Optimistic UI updates work correctly
- ✅ Mobile responsive design
- ✅ Dark mode compatible (if applicable)

### Code Quality Standards
- Use TypeScript for type safety
- Follow existing patterns in codebase
- Reuse existing components (Button, Modal, Card, etc.)
- Add comments for complex logic
- Use Framer Motion for animations
- Follow Tailwind CSS conventions
- Handle edge cases and errors gracefully

### Performance Considerations
- Debounce search inputs (300ms)
- Paginate large lists
- Optimize images (compression already implemented)
- Use React.memo for expensive components
- Lazy load images below fold

---

## 🎯 Success Metrics

Track these metrics to measure feature success:

**Engagement:**
- Increase in posts per user (Edit, Share features)
- Increase in session time (Dark Mode, Filters)
- Increase in place discoveries (Bookmarks, Trending)

**User Satisfaction:**
- Feature adoption rate (% of users using feature)
- Error rate (should be < 1%)
- User feedback/complaints

**Technical:**
- Page load time (should stay under 3s)
- API response time (should stay under 500ms)
- Error rate in production

---

## 📚 Resources & Dependencies

### NPM Packages Needed
```bash
# Image lightbox (optional)
npm install yet-another-react-lightbox

# Calendar export
npm install ics

# Mention autocomplete (optional)
npm install react-mentions
```

### Documentation Links
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
- [iCalendar Format](https://icalendar.org/)

---

## ✅ Definition of Done

A feature is considered complete when:
1. ✅ Code is committed and pushed to feature branch
2. ✅ Feature works on desktop and mobile
3. ✅ Error handling is implemented
4. ✅ Loading states are shown
5. ✅ Toast notifications provide feedback
6. ✅ Code follows existing patterns
7. ✅ No console errors
8. ✅ Feature is documented (if complex)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-05
**Next Review:** After Sprint 1 completion

---

*This implementation plan is a living document. Update it as priorities change or new features are requested.*
