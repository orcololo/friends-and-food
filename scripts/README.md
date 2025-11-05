# Scripts Directory

## seed-sample-data.ts

Populates the database with sample places and events that have proper location coordinates for testing map markers.

### Prerequisites

1. MongoDB must be running
2. You must have at least one user account created (sign up in the app first)
3. `MONGODB_URI` must be set in `.env.local`

### Usage

```bash
# Install ts-node if you haven't already
npm install -D ts-node

# Run the seed script
npx ts-node scripts/seed-sample-data.ts
```

### What it does

- Creates 6 sample restaurants in Macapá, Brazil area
- Creates 3 sample events linked to those places
- All items have valid GeoJSON coordinates in format: `[longitude, latitude]`
- Uses your first user account as the creator

### Sample Data Includes

**Places:**
- Restaurante Sabor Amazônico (Brazilian)
- Pizzaria Bella Napoli (Italian)
- Sushi Zen (Japanese)
- Taco Loco (Mexican)
- Café da Praça (American/Café)
- Churrascaria Gaúcha (Brazilian BBQ)

**Events:**
- Wine Tasting Night
- Sushi Making Workshop
- Sunday Brunch Meetup

### After Running

Visit `/map` in your app to see all the markers rendered on the interactive map!

### Troubleshooting

**Error: "No users found in database!"**
- Sign up for an account in the app first at `/auth/signup`

**Error: "MONGODB_URI is not defined"**
- Make sure `.env.local` exists and contains your MongoDB connection string

**Error: "Cannot find module"**
- Make sure you're in the project root directory
- Run `npm install` to ensure all dependencies are installed
