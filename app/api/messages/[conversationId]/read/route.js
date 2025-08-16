import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getMongooseConnection } from "@/lib/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";

export async function PUT(request, { params }) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || session.user._id || session.user.email;
    const { conversationId } = params;
    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    const convo = await Conversation.findById(conversationId).lean();
    if (!convo) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const isParticipant = (convo.participants || []).some(
      (p) => p.toString() === userId.toString(),
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filter = {
      conversationId: convo._id,
      receiverId: userId,
      isRead: false,
    };
    const result = await Message.updateMany(filter, {
      $set: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true, marked: result.modifiedCount });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 },
    );
  }
}
