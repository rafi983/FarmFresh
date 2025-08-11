import { useState } from "react";
import { useMessaging } from "@/contexts/MessagingContext";
import { formatDistanceToNow } from "date-fns";

export default function ConversationList({
  conversations,
  activeConversation,
  onSelectConversation,
  isMobile,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const { unreadCounts } = useMessaging();

  const filteredConversations = conversations.filter((conv) => {
    const participantName = conv.otherParticipant?.name?.toLowerCase() || "";
    const lastMessageText =
      typeof conv.lastMessage === "string"
        ? conv.lastMessage.toLowerCase()
        : typeof conv.lastMessage === "object" && conv.lastMessage?.content
          ? conv.lastMessage.content.toLowerCase()
          : "";

    return (
      participantName.includes(searchTerm.toLowerCase()) ||
      lastMessageText.includes(searchTerm.toLowerCase())
    );
  });

  const formatLastMessage = (message, type = "text") => {
    if (!message) return "No messages yet";
    if (type === "file") return "📎 File attachment";

    // Handle both string and object message formats
    let messageText = "";
    if (typeof message === "string") {
      messageText = message;
    } else if (typeof message === "object" && message?.content) {
      messageText =
        typeof message.content === "string"
          ? message.content
          : JSON.stringify(message.content);
    } else {
      return "No messages yet";
    }

    return messageText.length > 50
      ? `${messageText.substring(0, 50)}...`
      : messageText;
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced search section */}
      <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 placeholder-gray-400 shadow-sm hover:shadow-md"
          />
          <svg
            className="absolute left-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Enhanced conversations list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium">
              {searchTerm ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Start a conversation to see it here"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation?._id === conversation._id;
              const unreadCount = unreadCounts[conversation._id] || 0;

              return (
                <div
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`p-5 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-green-50 to-green-100 border-r-4 border-green-500 shadow-sm"
                      : "hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Enhanced avatar */}
                    <div className="relative">
                      {conversation.otherParticipant?.image ? (
                        <img
                          src={conversation.otherParticipant.image}
                          alt={conversation.otherParticipant.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                          <span className="text-white font-semibold text-base">
                            {(() => {
                              const name = conversation.otherParticipant?.name;
                              if (!name || typeof name !== "string") return "?";

                              const cleanName = name.trim();
                              if (cleanName.length === 0) return "?";

                              const firstWord = cleanName.split(" ")[0];
                              return firstWord.charAt(0).toUpperCase();
                            })()}
                          </span>
                        </div>
                      )}
                      {/* Enhanced online indicator */}
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full shadow-sm"></div>
                    </div>

                    {/* Enhanced conversation info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-base font-semibold text-gray-900 truncate">
                          {conversation.otherParticipant?.name ||
                            "Unknown User"}
                        </p>
                        {conversation.lastMessageAt && (
                          <p className="text-xs text-gray-500 flex-shrink-0 ml-3">
                            {formatDistanceToNow(
                              new Date(conversation.lastMessageAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <p
                          className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-gray-900" : "text-gray-600"}`}
                        >
                          {formatLastMessage(conversation.lastMessage)}
                        </p>
                        {unreadCount > 0 && (
                          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-full h-6 w-6 flex items-center justify-center ml-3 flex-shrink-0 shadow-md">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Enhanced role badge */}
                      {conversation.otherParticipant?.role && (
                        <span
                          className={`inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full ${
                            conversation.otherParticipant.role === "farmer"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {conversation.otherParticipant.role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
