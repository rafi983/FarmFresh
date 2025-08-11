"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const MessagingContext = createContext();

export function MessagingProvider({ children }) {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const queryClient = useQueryClient();

  // Stable user ID extraction
  const userId = useMemo(() => {
    const currentUser = session?.user;
    return (
      currentUser?.id ||
      currentUser?._id ||
      currentUser?.userId ||
      currentUser?.sub ||
      currentUser?.email
    );
  }, [
    session?.user?.id,
    session?.user?._id,
    session?.user?.userId,
    session?.user?.sub,
    session?.user?.email,
  ]);

  // Track if conversations have been fetched to prevent duplicate calls
  const conversationsFetched = useRef(false);

  // Fetch conversations - stabilized without session dependency
  const fetchConversations = useCallback(async () => {
    if (!userId) {
      console.error(
        "❌ MessagingContext - No user ID found for fetching conversations",
      );
      return;
    }

    // Prevent duplicate calls during hot reloads
    if (conversationsFetched.current) {
      return;
    }

    try {
      setIsLoading(true);
      conversationsFetched.current = true;

      const response = await fetch("/api/messages");

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "❌ Fetch conversations API error:",
          response.status,
          errorText,
        );
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }

      const data = await response.json();
      setConversations(data.conversations || []);

      // Update unread counts
      const counts = {};
      (data.conversations || []).forEach((conv) => {
        counts[conv._id] = conv.unreadCount;
      });
      setUnreadCounts(counts);
    } catch (error) {
      console.error(
        "❌ MessagingContext - Error fetching conversations:",
        error,
      );
      toast.error("Failed to load conversations");
      conversationsFetched.current = false; // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]); // Only depend on userId, not session

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId, page = 1) => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}&page=${page}`,
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();

      setMessages((prev) => ({
        ...prev,
        [conversationId]:
          page === 1
            ? data.messages
            : [...(prev[conversationId] || []), ...data.messages],
      }));

      return {
        hasMore: data.hasMore,
        messages: data.messages,
      };
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      toast.error("Failed to load messages");
      return null;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (receiverId, content, file, messageType = "text") => {
      if (!userId) {
        console.error("❌ No user ID found for sending message");
        return false;
      }

      try {
        const formData = new FormData();
        formData.append("receiverId", receiverId);
        formData.append("content", content);
        formData.append("messageType", messageType);

        if (file) {
          formData.append("file", file);
        }

        const response = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.status}`);
        }

        const data = await response.json();

        // Update messages state
        const conversationId = data.message.conversationId;
        setMessages((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), data.message],
        }));

        // Update conversations list
        setConversations((prev) => {
          const updated = [...prev];
          const convIndex = updated.findIndex((c) => c._id === conversationId);
          if (convIndex >= 0) {
            updated[convIndex] = {
              ...updated[convIndex],
              lastMessage: data.message,
              lastMessageAt: data.message.createdAt,
            };
          }
          return updated;
        });

        return data.message;
      } catch (error) {
        console.error("❌ Error sending message:", error);
        return false;
      }
    },
    [userId],
  );

  // Edit message
  const editMessage = useCallback(async (messageId, newContent) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        throw new Error("Failed to edit message");
      }

      const data = await response.json();

      // Update message in state
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((conversationId) => {
          const messageIndex = updated[conversationId].findIndex(
            (m) => m._id === messageId,
          );
          if (messageIndex >= 0) {
            updated[conversationId] = [...updated[conversationId]];
            updated[conversationId][messageIndex] = data.message;
          }
        });
        return updated;
      });

      return true;
    } catch (error) {
      console.error("❌ Error editing message:", error);
      toast.error("Failed to edit message");
      return false;
    }
  }, []);

  // React to message
  const reactToMessage = useCallback(async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        throw new Error("Failed to react to message");
      }

      const data = await response.json();

      // Update message reactions in state
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((conversationId) => {
          const messageIndex = updated[conversationId].findIndex(
            (m) => m._id === messageId,
          );
          if (messageIndex >= 0) {
            updated[conversationId] = [...updated[conversationId]];
            updated[conversationId][messageIndex] = {
              ...updated[conversationId][messageIndex],
              reactions: data.reactions,
            };
          }
        });
        return updated;
      });

      return true;
    } catch (error) {
      console.error("❌ Error reacting to message:", error);
      return false;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      // Remove message from state
      setMessages((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((conversationId) => {
          updated[conversationId] = updated[conversationId].filter(
            (m) => m._id !== messageId,
          );
        });
        return updated;
      });

      return true;
    } catch (error) {
      console.error("❌ Error deleting message:", error);
      toast.error("Failed to delete message");
      return false;
    }
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, {
        method: "PUT",
      });

      setUnreadCounts((prev) => ({
        ...prev,
        [conversationId]: 0,
      }));

      return true;
    } catch (error) {
      console.error("❌ Error marking conversation as read:", error);
      return false;
    }
  }, []);

  // Get total unread count
  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // Initialize conversations on userId change (not session change)
  useEffect(() => {
    if (userId && !conversationsFetched.current) {
      fetchConversations();
    }

    // Reset flag when userId changes
    if (!userId) {
      conversationsFetched.current = false;
    }
  }, [userId, fetchConversations]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      // State
      conversations,
      activeConversation,
      messages,
      unreadCounts,
      isLoading,
      typingUsers,
      onlineUsers,
      totalUnreadCount,

      // Actions
      setActiveConversation,
      fetchConversations,
      fetchMessages,
      sendMessage,
      editMessage,
      reactToMessage,
      deleteMessage,
      markConversationAsRead,
    }),
    [
      conversations,
      activeConversation,
      messages,
      unreadCounts,
      isLoading,
      typingUsers,
      onlineUsers,
      totalUnreadCount,
      fetchConversations,
      fetchMessages,
      sendMessage,
      editMessage,
      reactToMessage,
      deleteMessage,
      markConversationAsRead,
    ],
  );

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error("useMessaging must be used within a MessagingProvider");
  }
  return context;
}
