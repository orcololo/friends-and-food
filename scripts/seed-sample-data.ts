/**
 * Sample Data Seeding Script
 *
 * Run this script to populate your database with sample places and events
 * that have proper location coordinates for testing the map markers.
 *
 * Usage:
 * 1. Make sure MongoDB is running
 * 2. Install dependencies: npm install dotenv
 * 3. Run: npx ts-node scripts/seed-sample-data.ts
 *
 * Note: You'll need to have a user account first to create places/events.
 */

import mongoose from 'mongoose';

// Try to load dotenv if available
try {
  const dotenv = require('dotenv');
  dotenv.config({ path: '.env.local' });
} catch (e) {
  console.log('⚠️  dotenv not installed. Make sure MONGODB_URI is set in environment.');
}

// Sample Places Data with Coordinates (Macapá, Brazil area)
const samplePlaces = [
  {
    name: 'Restaurante Sabor Amazônico',
    description: 'Authentic Amazonian cuisine with fresh local ingredients. Famous for its tacacá and fish dishes.',
    address: 'Av. FAB, 1150 - Central, Macapá - AP, 68900-073',
    location: {
      type: 'Point',
      coordinates: [-51.0694, 0.0349], // [longitude, latitude]
    },
    cuisine: 'Brazilian',
    priceRange: 2,
    images: [],
    averageRating: 4.5,
  },
  {
    name: 'Pizzaria Bella Napoli',
    description: 'Traditional Italian pizza with wood-fired oven. Best pizza in town!',
    address: 'Rua Cândido Mendes, 1040 - Centro, Macapá - AP',
    location: {
      type: 'Point',
      coordinates: [-51.0661, 0.0389],
    },
    cuisine: 'Italian',
    priceRange: 3,
    images: [],
    averageRating: 4.8,
  },
  {
    name: 'Sushi Zen',
    description: 'Fresh sushi and Japanese cuisine. All-you-can-eat on Fridays!',
    address: 'Av. Mendonça Júnior, 777 - Buritizal, Macapá - AP',
    location: {
      type: 'Point',
      coordinates: [-51.0745, 0.0425],
    },
    cuisine: 'Japanese',
    priceRange: 3,
    images: [],
    averageRating: 4.6,
  },
  {
    name: 'Taco Loco',
    description: 'Authentic Mexican tacos, burritos, and margaritas. Lively atmosphere!',
    address: 'Rua Hamilton Silva, 2200 - Jesus de Nazaré, Macapá - AP',
    location: {
      type: 'Point',
      coordinates: [-51.0580, 0.0310],
    },
    cuisine: 'Mexican',
    priceRange: 2,
    images: [],
    averageRating: 4.3,
  },
  {
    name: 'Café da Praça',
    description: 'Cozy café with artisanal coffee and fresh pastries. Perfect for breakfast!',
    address: 'Praça Veiga Cabral - Centro, Macapá - AP',
    location: {
      type: 'Point',
      coordinates: [-51.0635, 0.0365],
    },
    cuisine: 'American',
    priceRange: 1,
    images: [],
    averageRating: 4.7,
  },
  {
    name: 'Churrascaria Gaúcha',
    description: 'All-you-can-eat Brazilian BBQ. Over 15 types of meat served tableside.',
    address: 'Av. Equatorial, 1500 - Centro, Macapá - AP',
    location: {
      type: 'Point',
      coordinates: [-51.0720, 0.0380],
    },
    cuisine: 'Brazilian',
    priceRange: 3,
    images: [],
    averageRating: 4.9,
  },
];

// Sample Events Data with Coordinates
const sampleEvents = [
  {
    title: 'Wine Tasting Night',
    description: 'Join us for an evening of fine wines and appetizers. Limited seating!',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    time: '19:00',
    location: {
      type: 'Point',
      coordinates: [-51.0694, 0.0349],
    },
    maxAttendees: 20,
    attendees: [],
  },
  {
    title: 'Sushi Making Workshop',
    description: 'Learn to make your own sushi! All materials provided.',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    time: '14:00',
    location: {
      type: 'Point',
      coordinates: [-51.0745, 0.0425],
    },
    maxAttendees: 15,
    attendees: [],
  },
  {
    title: 'Sunday Brunch Meetup',
    description: 'Casual brunch meetup for foodies. Come join us!',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    time: '11:00',
    location: {
      type: 'Point',
      coordinates: [-51.0635, 0.0365],
    },
    maxAttendees: 30,
    attendees: [],
  },
];

async function seedDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env.local');
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models (you'll need to adjust the paths)
    const Place = require('../lib/models/Place').default;
    const Event = require('../lib/models/Event').default;
    const User = require('../lib/models/User').default;

    // Check if there's at least one user to associate with the data
    const users = await User.find().limit(1);

    if (users.length === 0) {
      console.error('❌ No users found in database!');
      console.log('👉 Please create a user account first by signing up in the app.');
      process.exit(1);
    }

    const sampleUser = users[0];
    console.log(`✅ Using user: ${sampleUser.name} (${sampleUser.username})`);

    // Seed Places
    console.log('\n📍 Seeding sample places...');

    for (const placeData of samplePlaces) {
      const exists = await Place.findOne({ name: placeData.name });

      if (!exists) {
        await Place.create({
          ...placeData,
          createdBy: sampleUser._id,
        });
        console.log(`  ✅ Created: ${placeData.name}`);
      } else {
        console.log(`  ⏭️  Skipped (already exists): ${placeData.name}`);
      }
    }

    // Seed Events
    console.log('\n📅 Seeding sample events...');

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const place = await Place.findOne({ name: samplePlaces[i]?.name });

      if (place) {
        const exists = await Event.findOne({ title: eventData.title });

        if (!exists) {
          await Event.create({
            ...eventData,
            organizer: sampleUser._id,
            placeId: place._id,
          });
          console.log(`  ✅ Created: ${eventData.title}`);
        } else {
          console.log(`  ⏭️  Skipped (already exists): ${eventData.title}`);
        }
      }
    }

    console.log('\n✨ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Places: ${samplePlaces.length} sample records`);
    console.log(`   - Events: ${sampleEvents.length} sample records`);
    console.log(`   - All with valid coordinates for map markers!`);
    console.log('\n🗺️  Now visit /map to see the markers on the map!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seed function
seedDatabase();
