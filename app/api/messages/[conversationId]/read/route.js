import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversationId = params.conversationId;
    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    // Enhanced user ID detection
    const currentUser = session.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    if (!userId) {
      console.error("❌ No user ID found for marking conversation as read");
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farm-fresh");

    // Mark all messages in this conversation as read for the current user
    const result = await db.collection("messages").updateMany(
      {
        conversationId: new ObjectId(conversationId),
        receiverId: new ObjectId(userId),
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      markedAsRead: result.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error marking conversation as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
