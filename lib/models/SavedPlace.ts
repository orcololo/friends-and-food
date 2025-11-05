import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISavedPlace extends Document {
  userId: mongoose.Types.ObjectId;
  placeId: mongoose.Types.ObjectId;
  savedAt: Date;
}

const SavedPlaceSchema = new Schema<ISavedPlace>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    placeId: {
      type: Schema.Types.ObjectId,
      ref: 'Place',
      required: true,
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Unique constraint: one save per user per place
SavedPlaceSchema.index({ userId: 1, placeId: 1 }, { unique: true });

const SavedPlace: Model<ISavedPlace> =
  mongoose.models.SavedPlace || mongoose.model<ISavedPlace>('SavedPlace', SavedPlaceSchema);

export default SavedPlace;
