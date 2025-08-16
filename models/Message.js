import mongoose, { Schema } from "mongoose";

const ReactionSchema = new Schema(
  {
    userId: { type: Schema.Types.Mixed },
    emoji: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const MessageSchema = new Schema(
  {
    conversationId: { type: Schema.Types.Mixed, index: true },
    senderId: { type: Schema.Types.Mixed, index: true },
    receiverId: { type: Schema.Types.Mixed, index: true },
    content: { type: String, default: "" },
    messageType: { type: String, default: "text" },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    isEdited: { type: Boolean, default: false },
    editedAt: Date,
    reactions: [ReactionSchema],
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
  },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
