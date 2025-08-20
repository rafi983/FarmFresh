import mongoose, { Schema } from "mongoose";

const ConversationSchema = new Schema(
  {
    participants: [{ type: Schema.Types.Mixed }],
    participantIds: [{ type: String }],
    lastMessageAt: { type: Date, default: Date.now },
    lastMessage: { type: String },
    lastMessageSender: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

const Conversation =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", ConversationSchema);
export default Conversation;
