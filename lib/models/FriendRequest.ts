import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFriendRequest extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const FriendRequestSchema = new Schema<IFriendRequest>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique friend requests
FriendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });
FriendRequestSchema.index({ toUserId: 1, status: 1 });

const FriendRequest: Model<IFriendRequest> =
  mongoose.models.FriendRequest || mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);

export default FriendRequest;
