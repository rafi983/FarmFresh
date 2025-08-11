import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// GET: Get conversation details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Enhanced user ID detection - same logic as main messages route
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    if (!userId) {
      console.error("❌ Conversation API - No user ID found in GET session:", {
        session: session?.user,
      });
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Verify user is participant in this conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId), // Use extracted userId
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Get other participant details
    const otherParticipantId = conversation.participants.find(
      (p) => !p.equals(new ObjectId(userId)), // Use extracted userId
    );

    const otherParticipant = await db
      .collection("users")
      .findOne(
        { _id: otherParticipantId },
        { projection: { name: 1, email: 1, image: 1, role: 1 } },
      );

    return NextResponse.json({
      conversation: {
        ...conversation,
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

// PUT: Update conversation settings
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    // Enhanced user ID detection - same logic as main messages route
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    if (!userId) {
      console.error("❌ Conversation API - No user ID found in PUT session:", {
        session: session?.user,
      });
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const { conversationId } = params;
    const { action, settings } = await request.json();

    const client = await clientPromise;
    const db = client.db("farmfresh");

    // Verify user is participant in this conversation
    const conversation = await db.collection("conversations").findOne({
      _id: new ObjectId(conversationId),
      participants: new ObjectId(userId), // Use extracted userId
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    if (action === "markAllRead") {
      console.log(
        "📖 Conversation API - Marking messages as read for user:",
        userId,
      );

      const result = await db.collection("messages").updateMany(
        {
          conversationId: new ObjectId(conversationId),
          receiverId: new ObjectId(userId), // Use extracted userId
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          },
        },
      );

      console.log(
        "✅ Conversation API - Marked messages as read:",
        result.modifiedCount,
        "messages",
      );
    } else if (action === "updateSettings") {
      // Update user-specific conversation settings
      await db.collection("conversationSettings").updateOne(
        {
          conversationId: new ObjectId(conversationId),
          userId: new ObjectId(userId), // Use extracted userId
        },
        {
          $set: {
            ...settings,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      );
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
