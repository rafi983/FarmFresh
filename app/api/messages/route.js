import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { uploadToCloudStorage } from "@/lib/cloud-storage";
import { getMongooseConnection } from "@/lib/mongoose";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import User from "@/models/User";
import Farmer from "@/models/Farmer";

export async function GET(request) {
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

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;
    const isValidUserObjectId = /^[0-9a-fA-F]{24}$/.test(userId);

    if (conversationId) {
      const convoFilter = { _id: conversationId };
      if (ObjectId.isValid(conversationId))
        convoFilter._id = new ObjectId(conversationId);
      const convo = await Conversation.findOne(convoFilter).lean();
      if (!convo)
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      // Ensure participant
      const isParticipant = (convo.participants || []).some(
        (p) => p.toString() === userId.toString(),
      );
      if (!isParticipant)
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const messages = await Message.find({ conversationId: convo._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Mark as read
      await Message.updateMany(
        {
          conversationId: convo._id,
          receiverId: isValidUserObjectId ? new ObjectId(userId) : userId,
          isRead: false,
        },
        { $set: { isRead: true, readAt: new Date() } },
      );

      return NextResponse.json({
        messages: messages.reverse(),
        page,
        hasMore: messages.length === limit,
      });
    }

    // Fetch user conversations
    let conversationQuery;
    if (isValidUserObjectId) {
      conversationQuery = { participants: userId }; // we store Mixed; direct match works
    } else {
      conversationQuery = {
        $or: [{ participants: userId }, { participantIds: userId }],
      };
    }

    const conversations = await Conversation.find(conversationQuery)
      .sort({ lastMessageAt: -1 })
      .lean();

    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const other = (conv.participants || []).find(
          (p) => p.toString() !== userId.toString(),
        );
        let otherParticipant = null;
        if (other) {
          if (ObjectId.isValid(other)) {
            otherParticipant = await User.findById(other)
              .select("name email image role")
              .lean();
          }
          if (!otherParticipant) {
            const farmerQuery = ObjectId.isValid(other)
              ? { _id: other }
              : { $or: [{ email: other }, { userId: other }] };
            otherParticipant = await Farmer.findOne(farmerQuery)
              .select("name email profilePicture verified")
              .lean();
            if (otherParticipant) {
              otherParticipant.image = otherParticipant.profilePicture;
              otherParticipant.role = "farmer";
            }
          }
        }
        const unreadFilter = {
          conversationId: conv._id,
          isRead: false,
          receiverId: isValidUserObjectId ? userId : userId,
        };
        const unreadCount = await Message.countDocuments(unreadFilter);
        return { ...conv, otherParticipant, unreadCount };
      }),
    );

    return NextResponse.json({ conversations: enriched });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
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

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const receiverId = formData.get("receiverId");
    const content = formData.get("content");
    const messageType = formData.get("messageType") || "text";
    const file = formData.get("file");

    if (!receiverId)
      return NextResponse.json(
        { error: "Receiver ID is required" },
        { status: 400 },
      );

    let fileUrl = null,
      fileName = null,
      fileSize = null;
    if (file && file.size > 0) {
      const buffer = await file.arrayBuffer();
      const uploadResult = await uploadToCloudStorage(
        Buffer.from(buffer),
        `messages/${Date.now()}-${file.name}`,
        file.type,
      );
      fileUrl = uploadResult.url;
      fileName = file.name;
      fileSize = file.size;
    }

    const senderIsObj = ObjectId.isValid(userId);
    const receiverIsObj = ObjectId.isValid(receiverId);
    const participants = [
      senderIsObj ? new ObjectId(userId) : userId,
      receiverIsObj ? new ObjectId(receiverId) : receiverId,
    ].sort((a, b) => a.toString().localeCompare(b.toString()));

    let conversation = await Conversation.findOne({
      participants: { $all: participants },
    }).lean();
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        participantIds: participants.map((p) => p.toString()),
        lastMessageAt: new Date(),
        lastMessage: content || (file ? `📎 ${fileName}` : ""),
        lastMessageSender: senderIsObj ? new ObjectId(userId) : userId,
      });
    } else {
      await Conversation.updateOne(
        { _id: conversation._id },
        {
          $set: {
            lastMessageAt: new Date(),
            lastMessage: content || (file ? `📎 ${fileName}` : ""),
            lastMessageSender: senderIsObj ? new ObjectId(userId) : userId,
          },
        },
      );
    }

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: senderIsObj ? new ObjectId(userId) : userId,
      receiverId: receiverIsObj ? new ObjectId(receiverId) : receiverId,
      content: content || "",
      messageType,
      fileUrl,
      fileName,
      fileSize,
      isRead: false,
    });

    return NextResponse.json(
      { message, conversationId: conversation._id },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { messageId, content, action, emoji } = await request.json();
    if (!messageId)
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 },
      );

    const msg = await Message.findById(messageId);
    if (!msg)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const sessionUserId = session.user.id;
    const sessionObjId = ObjectId.isValid(sessionUserId)
      ? new ObjectId(sessionUserId)
      : sessionUserId;

    if (action === "edit") {
      if (msg.senderId.toString() !== sessionObjId.toString())
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      msg.content = content;
      msg.isEdited = true;
      msg.editedAt = new Date();
      await msg.save();
    } else if (action === "react") {
      const userKey = sessionObjId.toString();
      msg.reactions = msg.reactions || [];
      const existing = msg.reactions.find(
        (r) => r.userId.toString() === userKey && r.emoji === emoji,
      );
      if (existing) {
        msg.reactions = msg.reactions.filter(
          (r) => !(r.userId.toString() === userKey && r.emoji === emoji),
        );
      } else {
        msg.reactions.push({
          userId: sessionObjId,
          emoji,
          createdAt: new Date(),
        });
      }
      await msg.save();
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to update message" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    await getMongooseConnection();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get("messageId");
    if (!messageId)
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 },
      );

    const msg = await Message.findById(messageId);
    if (!msg)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    const sessionUserId = session.user.id;
    if (msg.senderId.toString() !== sessionUserId.toString())
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    await Message.deleteOne({ _id: messageId });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
