import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useSession } from "next-auth/react";
import { useMessaging } from "@/contexts/MessagingContext";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { formatDistanceToNow } from "date-fns";

function ChatWindow({ conversation, onBack, isMobile }) {
  const { data: session } = useSession();
  const {
    messages,
    fetchMessages,
    markConversationAsRead,
    editMessage,
    reactToMessage,
    deleteMessage,
  } = useMessaging();

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Memoize conversation messages to prevent unnecessary re-renders
  const conversationMessages = useMemo(() => {
    return messages[conversation._id] || [];
  }, [messages, conversation._id]);

  // Memoize other participant data
  const otherParticipant = useMemo(() => {
    return conversation.otherParticipant;
  }, [conversation.otherParticipant]);

  // Stable scroll function
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Optimized load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || isLoading || !conversation._id) return;

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const data = await fetchMessages(conversation._id, nextPage);
      if (data) {
        setPage(nextPage);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, conversation._id, page, fetchMessages]);

  // Optimized scroll handler
  const handleScroll = useCallback(
    (e) => {
      const { scrollTop } = e.target;
      if (scrollTop === 0 && hasMore && !isLoading) {
        loadMoreMessages();
      }
    },
    [hasMore, isLoading, loadMoreMessages],
  );

  // Fetch messages when conversation changes - only depend on conversation ID
  useEffect(() => {
    if (!conversation._id) return;

    setIsLoading(true);
    setPage(1);

    const fetchInitialMessages = async () => {
      try {
        const data = await fetchMessages(conversation._id, 1);
        if (data) {
          setHasMore(data.hasMore || false);
          await markConversationAsRead(conversation._id);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialMessages();
  }, [conversation._id]); // Only depend on conversation ID

  // Scroll to bottom on new messages - debounced and optimized
  useEffect(() => {
    if (conversationMessages.length > 0) {
      // Use timeout to batch multiple rapid updates
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          scrollToBottom();
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [conversationMessages.length, scrollToBottom]);

  // Memoize header content to prevent unnecessary re-renders
  const headerContent = useMemo(() => {
    const isOnline = Math.random() > 0.5; // Replace with real online status
    const lastSeen = formatDistanceToNow(new Date(), { addSuffix: true });

    // Enhanced avatar initial generation with debugging
    const getAvatarInitial = (participant) => {
      if (!participant) return "?";

      // Debug logging to identify the issue
      console.log("🔍 Avatar Debug - Participant data:", {
        name: participant.name,
        email: participant.email,
        id: participant._id,
        allKeys: Object.keys(participant),
      });

      // Try multiple name fields and formats
      const name =
        participant.name || participant.displayName || participant.email;
      if (!name) return "?";

      // Handle different name formats
      let initial = "?";
      if (typeof name === "string") {
        // Clean the name and get first character
        const cleanName = name.trim();
        if (cleanName.length > 0) {
          // If name contains spaces, get first letter of first word
          const firstWord = cleanName.split(" ")[0];
          initial = firstWord.charAt(0).toUpperCase();
        }
      }

      console.log("🔍 Avatar Debug - Generated initial:", {
        originalName: name,
        generatedInitial: initial,
      });

      return initial;
    };

    const avatarInitial = getAvatarInitial(otherParticipant);

    return (
      <div className="flex items-center space-x-3 flex-1">
        {otherParticipant?.image ? (
          <img
            src={otherParticipant.image}
            alt={otherParticipant.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {avatarInitial}
            </span>
          </div>
        )}

        <div>
          <h2 className="font-semibold text-gray-900">
            {otherParticipant?.name || "Unknown User"}
          </h2>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-green-400" : "bg-gray-400"
              }`}
            ></span>
            <span>{isOnline ? "Online" : `Last seen ${lastSeen}`}</span>
            {otherParticipant?.role && (
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  otherParticipant.role === "farmer"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {otherParticipant.role}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [otherParticipant]);

  // Memoize message list to prevent unnecessary re-renders
  const messageList = useMemo(() => {
    return conversationMessages.map((message, index) => {
      // Enhanced user ID comparison to handle different formats
      const currentUser = session?.user;
      const currentUserId =
        currentUser?.id ||
        currentUser?._id ||
        currentUser?.userId ||
        currentUser?.sub ||
        currentUser?.email;

      // Debug logging to identify the isOwn calculation issue
      if (index === 0) {
        // Only log for first message to avoid spam
        console.log("🔍 MessageList Debug - User ID comparison:", {
          sessionUser: currentUser,
          currentUserId,
          messageSenderId: message.senderId,
          messageId: message._id,
          isOwnBefore: message.senderId === session?.user?.id,
          isOwnAfter:
            message.senderId === currentUserId ||
            message.senderId?.toString() === currentUserId?.toString(),
          messageContent: message.content,
        });
      }

      // More robust isOwn calculation
      const isOwn =
        message.senderId === currentUserId ||
        message.senderId?.toString() === currentUserId?.toString();

      const showAvatar =
        index === conversationMessages.length - 1 ||
        conversationMessages[index + 1]?.senderId !== message.senderId;

      return (
        <MessageBubble
          key={message._id}
          message={message}
          isOwn={isOwn}
          showAvatar={showAvatar}
          otherParticipant={otherParticipant}
          onEdit={editMessage}
          onReact={reactToMessage}
          onDelete={deleteMessage}
        />
      );
    });
  }, [
    conversationMessages,
    session?.user?.id,
    otherParticipant,
    editMessage,
    reactToMessage,
    deleteMessage,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {headerContent}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {isLoading && page === 1 && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        )}

        {hasMore && conversationMessages.length > 0 && (
          <div className="text-center">
            <button
              onClick={loadMoreMessages}
              disabled={isLoading}
              className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Load more messages"}
            </button>
          </div>
        )}

        {messageList}

        {conversationMessages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white">
        <MessageInput
          receiverId={otherParticipant?._id}
          conversationId={conversation._id}
        />
      </div>
    </div>
  );
}

// Export memoized component to prevent re-renders when parent updates
export default memo(ChatWindow);
