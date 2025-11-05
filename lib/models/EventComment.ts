import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IEventComment extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventCommentSchema = new Schema<IEventComment>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
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
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

EventCommentSchema.index({ eventId: 1, createdAt: -1 });

const EventComment: Model<IEventComment> =
  mongoose.models.EventComment || mongoose.model<IEventComment>('EventComment', EventCommentSchema);

export default EventComment;
