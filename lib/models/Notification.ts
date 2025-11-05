import mongoose, { Document, Model, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'friend_request' | 'friend_accepted' | 'event_invite' | 'event_update' | 'new_post' | 'new_review' | 'group_invite';
  title: string;
  message: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  fromUserId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['friend_request', 'friend_accepted', 'event_invite', 'event_update', 'new_post', 'new_review', 'group_invite'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedModel',
    },
    relatedModel: {
      type: String,
      enum: ['User', 'Event', 'Post', 'Review', 'Group', 'Place'],
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
NotificationSchema.index({ userId: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
