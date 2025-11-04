import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPlace extends Document {
  name: string;
  description?: string;
  address: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  cuisine: string;
  priceRange: 1 | 2 | 3 | 4;
  images: string[];
  createdBy: mongoose.Types.ObjectId;
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

const PlaceSchema = new Schema<IPlace>(
  {
    name: {
      type: String,
      required: [true, 'Place name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    cuisine: {
      type: String,
      required: [true, 'Cuisine type is required'],
      trim: true,
    },
    priceRange: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
      default: 2,
    },
    images: [
      {
        type: String,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
PlaceSchema.index({ location: '2dsphere' });
PlaceSchema.index({ cuisine: 1 });
PlaceSchema.index({ averageRating: -1 });

const Place: Model<IPlace> = mongoose.models.Place || mongoose.model<IPlace>('Place', PlaceSchema);

export default Place;
