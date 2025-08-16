import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.Mixed, index: true }],
    participantIds: [{ type: String }], // legacy support
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessage: { type: String },
    lastMessageSender: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ "participants.0": 1, "participants.1": 1 });

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
export default Conversation;
