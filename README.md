# Friends & Food - Social Restaurant Planning App

A full-stack Next.js application where friends can discover restaurants, plan dining events together, share reviews, and coordinate meetups through an interactive map interface.

## Features Implemented

### Core Functionality
- **Authentication System**: JWT-based email/password authentication with secure password hashing
- **User Profiles**: User management with profile information and friend connections
- **Places (Restaurants)**: Full CRUD operations for restaurant/place management
- **Events**: Create and manage dining events with RSVP functionality
- **Reviews & Ratings**: 5-star rating system with comments and images
- **Posts**: Social feed with likes and comments
- **Groups**: Create and manage food communities
- **Interactive Map**: Mapbox integration showing places and events with markers
- **Geospatial Queries**: Find nearby places and users using MongoDB geospatial features

### Technical Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Maps**: Mapbox GL JS

## Project Structure

```
friends-and-food/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── me/
│   │   ├── places/               # Places CRUD + nearby search
│   │   ├── events/               # Events CRUD + attendance
│   │   ├── reviews/              # Review management
│   │   ├── posts/                # Posts and likes
│   │   └── groups/               # Group management
│   ├── auth/                     # Auth pages (login/signup)
│   ├── dashboard/                # Main dashboard
│   ├── map/                      # Interactive map view
│   ├── places/                   # Places listing
│   ├── events/                   # Events listing
│   ├── groups/                   # Groups listing
│   └── page.tsx                  # Landing page
├── components/
│   ├── ui/                       # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Navbar.tsx
│   ├── map/                      # Map components
│   │   └── MapView.tsx
│   └── [feature]/                # Feature-specific components
├── lib/
│   ├── db/                       # Database configuration
│   │   └── mongodb.ts
│   ├── models/                   # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Place.ts
│   │   ├── Event.ts
│   │   ├── Review.ts
│   │   ├── Post.ts
│   │   └── Group.ts
│   ├── middleware/               # Authentication middleware
│   │   └── auth.ts
│   └── utils/                    # Utility functions
│       ├── auth.ts               # JWT & password utilities
│       ├── api.ts                # API client
│       └── response.ts           # Response helpers
└── .env.local                    # Environment variables
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Mapbox account (for map features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd friends-and-food
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create or update `.env.local` with your configuration:
   ```env
   # MongoDB - Replace with your connection string
   MONGODB_URI=mongodb://localhost:27017/friends-and-food
   # Or use MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/friends-and-food

   # JWT - Generate a secure random string
   JWT_SECRET=your-secure-secret-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Mapbox (Required for map features)
   NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your-mapbox-token

   # Optional: Cloudinary for image uploads
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start MongoDB**

   If using local MongoDB:
   ```bash
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## API Documentation

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "username": "johndoe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Places

#### Get All Places
```http
GET /api/places?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Nearby Places
```http
GET /api/places/nearby?lng=-74.006&lat=40.7128&maxDistance=5000
Authorization: Bearer <token>
```

#### Create Place
```http
POST /api/places
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Amazing Restaurant",
  "address": "123 Main St",
  "location": {
    "type": "Point",
    "coordinates": [-74.006, 40.7128]
  },
  "cuisine": "Italian",
  "priceRange": 2
}
```

### Events

#### Get All Events
```http
GET /api/events?page=1&limit=20
Authorization: Bearer <token>
```

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Dinner with Friends",
  "description": "Let's try this new place!",
  "placeId": "place_id_here",
  "date": "2024-12-31",
  "time": "19:00"
}
```

#### RSVP to Event
```http
POST /api/events/:id/attend
Authorization: Bearer <token>
```

### Reviews

#### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "placeId": "place_id_here",
  "rating": 5,
  "comment": "Great food and atmosphere!",
  "images": []
}
```

## Data Models

### User
- Email (unique), password (hashed), name, username
- Profile image, bio
- Location (GeoJSON Point)
- Friends array

### Place
- Name, description, address
- Location (GeoJSON Point) with 2dsphere index
- Cuisine type, price range (1-4)
- Images array
- Average rating

### Event
- Title, description
- Place reference
- Organizer and attendees
- Date, time, status
- Location (copied from place)

### Review
- User and place references
- Rating (1-5), comment
- Images array
- Unique constraint: one review per user per place

### Post
- User reference
- Content, images
- Optional place reference
- Likes and comments arrays

### Group
- Name, description, cover image
- Creator and members
- Private/public flag

## Geospatial Features

The app uses MongoDB's geospatial capabilities for location-based queries:

- **2dsphere indexes** on location fields for efficient spatial queries
- **$near** queries to find places/events within a specified distance
- GeoJSON format: `{ type: "Point", coordinates: [longitude, latitude] }`

Example: Finding restaurants within 5km:
```javascript
Place.find({
  location: {
    $near: {
      $geometry: { type: 'Point', coordinates: [lng, lat] },
      $maxDistance: 5000 // meters
    }
  }
})
```

## Authentication Flow

1. User registers with email/password
2. Password is hashed using bcrypt
3. JWT token is generated and returned
4. Client stores token in localStorage
5. Token is sent in Authorization header for protected routes
6. Middleware verifies token and attaches user info to request

## UI Components

All UI components use Tailwind CSS for styling and Framer Motion for animations:

- **Button**: Multiple variants (primary, secondary, outline, danger)
- **Input**: Form inputs with labels and error states
- **Card**: Container with hover effects
- **Modal**: Animated overlay modals
- **Navbar**: Responsive navigation with authentication state

## Map Integration

The map view uses Mapbox GL JS:

1. Initialize map with center coordinates and zoom level
2. Add markers for places (🍽️) and events (📅)
3. Show popups on marker click with details
4. Filter view by places only, events only, or both

To enable maps:
1. Sign up for a free Mapbox account at https://www.mapbox.com/
2. Get your access token
3. Add it to `.env.local` as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

## Next Steps & Future Enhancements

### Immediate Improvements
- [ ] Add real-time features with Socket.io or Pusher
- [ ] Implement image upload with Cloudinary
- [ ] Add search functionality across resources
- [ ] Create detail pages for places, events, and groups
- [ ] Add profile page with edit functionality
- [ ] Implement friend system (add/remove friends)
- [ ] Add notifications system

### Advanced Features
- [ ] Direct messaging between users
- [ ] Integration with Yelp/Google Places API
- [ ] Advanced filtering and sorting
- [ ] Calendar view for events
- [ ] Event chat/comments
- [ ] Group feeds and group events
- [ ] Photo galleries for places
- [ ] Recommendation engine
- [ ] Mobile app with React Native

## Development Guidelines

### Adding New Features

1. **Create API Route**: Add route in `app/api/[resource]/`
2. **Update Model**: Modify or create Mongoose schema in `lib/models/`
3. **Add UI Component**: Create component in `components/`
4. **Create Page**: Add page in `app/[route]/`
5. **Update API Client**: Add method to `lib/utils/api.ts`

### Code Style

- Use TypeScript for type safety
- Follow Next.js App Router conventions
- Use server components by default, add 'use client' when needed
- Keep components small and focused
- Use Tailwind utility classes for styling
- Add proper error handling and loading states

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check Atlas connection
- Verify `MONGODB_URI` in `.env.local`
- Check network connectivity for Atlas

### Map Not Loading
- Verify Mapbox token is set in `.env.local`
- Check browser console for errors
- Ensure `NEXT_PUBLIC_` prefix is present

### Authentication Errors
- Clear localStorage and try logging in again
- Check JWT_SECRET is set in `.env.local`
- Verify token expiration settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or as a starting point for your own applications.

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
