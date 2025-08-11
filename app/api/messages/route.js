import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { uploadToCloudStorage } from "@/lib/cloud-storage";

// Track if indexes have been initialized
let messagesIndexesInitialized = false;

// Initialize indexes optimized for messaging queries
async function initializeMessagesIndexes(db) {
  if (messagesIndexesInitialized) return;

  try {
    const messagesCollection = db.collection("messages");
    const conversationsCollection = db.collection("conversations");

    const existingMessageIndexes = await messagesCollection
      .listIndexes()
      .toArray();
    const existingConversationIndexes = await conversationsCollection
      .listIndexes()
      .toArray();

    const messageIndexNames = existingMessageIndexes.map((index) => index.name);
    const conversationIndexNames = existingConversationIndexes.map(
      (index) => index.name,
    );

    // Message indexes
    const messageIndexesToCreate = [
      {
        key: { conversationId: 1, createdAt: -1 },
        name: "conversationId_createdAt_idx",
        condition: !messageIndexNames.includes("conversationId_createdAt_idx"),
      },
      {
        key: { senderId: 1, createdAt: -1 },
        name: "senderId_createdAt_idx",
        condition: !messageIndexNames.includes("senderId_createdAt_idx"),
      },
      {
        key: { receiverId: 1, isRead: 1 },
        name: "receiverId_isRead_idx",
        condition: !messageIndexNames.includes("receiverId_isRead_idx"),
      },
    ];

    // Conversation indexes
    const conversationIndexesToCreate = [
      {
        key: { participants: 1, lastMessageAt: -1 },
        name: "participants_lastMessage_idx",
        condition: !conversationIndexNames.includes(
          "participants_lastMessage_idx",
        ),
      },
      {
        key: { "participants.0": 1, "participants.1": 1 },
        name: "participants_compound_idx",
        condition: !conversationIndexNames.includes(
          "participants_compound_idx",
        ),
      },
    ];

    // Create message indexes
    for (const index of messageIndexesToCreate) {
      if (index.condition) {
        await messagesCollection.createIndex(index.key, {
          name: index.name,
          background: true,
        });
      }
    }

    // Create conversation indexes
    for (const index of conversationIndexesToCreate) {
      if (index.condition) {
        await conversationsCollection.createIndex(index.key, {
          name: index.name,
          background: true,
        });
      }
    }

    messagesIndexesInitialized = true;
  } catch (error) {
    console.error("Error initializing message indexes:", error);
  }
}

// GET: Fetch conversations for a user
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    // Enhanced user ID detection - same logic as POST handler
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    console.log("🔍 Messages API - GET request:", {
      sessionExists: !!session,
      userExists: !!currentUser,
      userId,
      userKeys: currentUser ? Object.keys(currentUser) : "no user",
    });

    if (!userId) {
      console.error("❌ Messages API - No user ID found in GET session:", {
        session: session?.user,
      });
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");
    await initializeMessagesIndexes(db);

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    if (conversationId) {
      // Fetch messages for a specific conversation
      const messages = await db
        .collection("messages")
        .find({ conversationId: new ObjectId(conversationId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .toArray();

      // Mark messages as read
      await db.collection("messages").updateMany(
        {
          conversationId: new ObjectId(conversationId),
          receiverId: new ObjectId(userId), // Use extracted userId
          isRead: false,
        },
        { $set: { isRead: true, readAt: new Date() } },
      );

      return NextResponse.json({
        messages: messages.reverse(),
        page,
        hasMore: messages.length === limit,
      });
    } else {
      // Fetch all conversations for the user
      const conversations = await db
        .collection("conversations")
        .find({ participants: new ObjectId(userId) }) // Use extracted userId
        .sort({ lastMessageAt: -1 })
        .toArray();

      console.log(
        `📋 Messages API - Found ${conversations.length} conversations for user ${userId}`,
      );

      // Get participant details and unread counts
      const enrichedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const otherParticipantId = conv.participants.find(
            (p) => !p.equals(new ObjectId(userId)), // Use extracted userId
          );

          const otherParticipant = await db
            .collection("users")
            .findOne(
              { _id: otherParticipantId },
              { projection: { name: 1, email: 1, image: 1, role: 1 } },
            );

          const unreadCount = await db.collection("messages").countDocuments({
            conversationId: conv._id,
            receiverId: new ObjectId(userId), // Use extracted userId
            isRead: false,
          });

          return {
            ...conv,
            otherParticipant,
            unreadCount,
          };
        }),
      );

      return NextResponse.json({ conversations: enrichedConversations });
    }
  } catch (error) {
    console.error("❌ Messages API - GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

// POST: Send a new message
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    // Enhanced user ID detection - same logic as frontend components
    const currentUser = session?.user;
    const userId =
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email;

    console.log("🔍 Messages API - POST request:", {
      sessionExists: !!session,
      userExists: !!currentUser,
      userId,
      userKeys: currentUser ? Object.keys(currentUser) : "no user",
    });

    if (!userId) {
      console.error("❌ Messages API - No user ID found in session:", {
        session: session?.user,
      });
      return NextResponse.json(
        { error: "Unauthorized - No valid user ID found" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const receiverId = formData.get("receiverId");
    const content = formData.get("content");
    const messageType = formData.get("messageType") || "text";
    const file = formData.get("file");

    console.log("📤 Messages API - Processing message:", {
      receiverId,
      content: content?.substring(0, 50) + "...",
      messageType,
      hasFile: !!file,
    });

    if (!receiverId) {
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");
    await initializeMessagesIndexes(db);

    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    // Handle file upload
    if (file && file.size > 0) {
      try {
        const buffer = await file.arrayBuffer();
        const uploadResult = await uploadToCloudStorage(
          Buffer.from(buffer),
          `messages/${Date.now()}-${file.name}`,
          file.type,
        );
        fileUrl = uploadResult.url;
        fileName = file.name;
        fileSize = file.size;
      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return NextResponse.json(
          { error: "Failed to upload file" },
          { status: 500 },
        );
      }
    }

    // Find or create conversation
    const participants = [
      new ObjectId(userId), // Use the extracted userId instead of session.user.id
      new ObjectId(receiverId),
    ].sort((a, b) => a.toString().localeCompare(b.toString()));

    let conversation = await db.collection("conversations").findOne({
      participants: { $all: participants },
    });

    if (!conversation) {
      const newConversation = {
        participants,
        createdAt: new Date(),
        lastMessageAt: new Date(),
        lastMessage: content || (file ? `📎 ${fileName}` : ""),
        lastMessageSender: new ObjectId(userId), // Use extracted userId
      };

      const conversationResult = await db
        .collection("conversations")
        .insertOne(newConversation);
      conversation = { _id: conversationResult.insertedId, ...newConversation };
      console.log(
        "✅ Messages API - Created new conversation:",
        conversation._id,
      );
    }

    // Create the message
    const message = {
      conversationId: conversation._id,
      senderId: new ObjectId(userId), // Use extracted userId
      receiverId: new ObjectId(receiverId),
      content: content || "",
      messageType,
      fileUrl,
      fileName,
      fileSize,
      isRead: false,
      createdAt: new Date(),
      readAt: null,
      isEdited: false,
      editedAt: null,
      reactions: [],
    };

    const messageResult = await db.collection("messages").insertOne(message);
    console.log("✅ Messages API - Created message:", messageResult.insertedId);

    // Update conversation with last message
    await db.collection("conversations").updateOne(
      { _id: conversation._id },
      {
        $set: {
          lastMessageAt: new Date(),
          lastMessage: content || (file ? `📎 ${fileName}` : ""),
          lastMessageSender: new ObjectId(userId), // Use extracted userId
        },
      },
    );

    // Get sender info for the response
    const sender = await db.collection("users").findOne(
      { _id: new ObjectId(userId) }, // Use extracted userId
      { projection: { name: 1, email: 1, image: 1, role: 1 } },
    );

    const responseMessage = {
      _id: messageResult.insertedId,
      ...message,
      sender,
    };

    console.log(
      "🎉 Messages API - Successfully created message and conversation",
    );

    return NextResponse.json(
      {
        message: responseMessage,
        conversationId: conversation._id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Messages API - Error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

// PUT: Update message (edit or react)
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId, content, action, emoji } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    const message = await db.collection("messages").findOne({
      _id: new ObjectId(messageId),
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (action === "edit") {
      // Only sender can edit their own messages
      if (!message.senderId.equals(new ObjectId(session.user.id))) {
        return NextResponse.json(
          { error: "Unauthorized to edit this message" },
          { status: 403 },
        );
      }

      await db.collection("messages").updateOne(
        { _id: new ObjectId(messageId) },
        {
          $set: {
            content,
            isEdited: true,
            editedAt: new Date(),
          },
        },
      );
    } else if (action === "react") {
      // Add or remove reaction
      const userId = new ObjectId(session.user.id);
      const existingReaction = message.reactions?.find(
        (r) => r.userId.equals(userId) && r.emoji === emoji,
      );

      if (existingReaction) {
        // Remove reaction
        await db.collection("messages").updateOne(
          { _id: new ObjectId(messageId) },
          {
            $pull: {
              reactions: { userId, emoji },
            },
          },
        );
      } else {
        // Add reaction
        await db.collection("messages").updateOne(
          { _id: new ObjectId(messageId) },
          {
            $push: {
              reactions: {
                userId,
                emoji,
                createdAt: new Date(),
              },
            },
          },
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a message
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("farmfresh");

    const message = await db.collection("messages").findOne({
      _id: new ObjectId(messageId),
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Only sender can delete their own messages
    if (!message.senderId.equals(new ObjectId(session.user.id))) {
      return NextResponse.json(
        { error: "Unauthorized to delete this message" },
        { status: 403 },
      );
    }

    await db.collection("messages").deleteOne({
      _id: new ObjectId(messageId),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
