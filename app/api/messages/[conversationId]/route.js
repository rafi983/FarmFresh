import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getMongooseConnection } from "@/lib/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import Farmer from "@/models/Farmer";

// GET: Get conversation details (Mongoose)
export async function GET(request, { params }) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
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
      return NextResponse.json(
        { error: "Forbidden - User is not a participant in this conversation" },
        { status: 403 },
      );
    }

    const otherParticipantId = (convo.participants || []).find(
      (p) => p.toString() !== userId.toString(),
    );
    let otherParticipant = null;
    if (otherParticipantId) {
      if (ObjectId.isValid(otherParticipantId)) {
        otherParticipant = await User.findById(otherParticipantId)
          .select("name email image role")
          .lean();
      }
      if (!otherParticipant) {
        const farmerQuery = ObjectId.isValid(otherParticipantId)
          ? { _id: otherParticipantId }
          : {
              $or: [
                { email: otherParticipantId },
                { userId: otherParticipantId },
              ],
            };
        otherParticipant = await Farmer.findOne(farmerQuery)
          .select("name email profilePicture verified")
          .lean();
        if (otherParticipant) {
          otherParticipant.image = otherParticipant.profilePicture;
          otherParticipant.role = "farmer";
        }
      }
    }

    return NextResponse.json({
      conversation: {
        ...convo,
        otherParticipant,
      },
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}

// PUT: Update conversation settings / mark all read (Mongoose)
export async function PUT(request, { params }) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const { action, settings } = await request.json();

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
      return NextResponse.json(
        { error: "Forbidden - User is not a participant in this conversation" },
        { status: 403 },
      );
    }

    if (action === "markAllRead") {
      await Message.updateMany(
        { conversationId: convo._id, receiverId: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } },
      );
    } else if (action === "updateSettings") {
      // Update user-specific conversation settings
      // Placeholder for potential future implementation
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Conversation API - PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 },
    );
  }
}
