import mongoose, { Document, Model, Schema } from 'mongoose';

interface IComment {
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IGroupPost extends Document {
  groupId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const GroupPostSchema = new Schema<IGroupPost>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    images: [
      {
        type: String,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [CommentSchema],
  },
  {
    timestamps: true,
  }
);

GroupPostSchema.index({ groupId: 1, createdAt: -1 });

const GroupPost: Model<IGroupPost> =
  mongoose.models.GroupPost || mongoose.model<IGroupPost>('GroupPost', GroupPostSchema);

export default GroupPost;
