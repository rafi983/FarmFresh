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
    conversationId: { type: Schema.Types.Mixed },
    senderId: { type: Schema.Types.Mixed },
    receiverId: { type: Schema.Types.Mixed },
    content: { type: String, default: "" },
    messageType: { type: String, default: "text" },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    isRead: { type: Boolean, default: false },
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

const Message =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
