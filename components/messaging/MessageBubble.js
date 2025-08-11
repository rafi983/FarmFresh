import { useState, useRef, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

function MessageBubble({
  message,
  isOwn,
  showAvatar,
  otherParticipant,
  onEdit,
  onReact,
  onDelete,
}) {
  const { data: session } = useSession();
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(
    typeof message.content === "string"
      ? message.content
      : typeof message.content === "object"
        ? JSON.stringify(message.content)
        : message.content || "",
  );
  const [showReactions, setShowReactions] = useState(false);
  const fileInputRef = useRef(null);

  const reactions = ["👍", "❤️", "😊", "😮", "😢", "😡"];

  // Optimize handlers with useCallback
  const handleEdit = useCallback(() => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message._id, editContent.trim());
    }
    setIsEditing(false);
  }, [editContent, message.content, message._id, onEdit]);

  const handleReact = useCallback(
    (emoji) => {
      onReact(message._id, emoji);
      setShowReactions(false);
    },
    [message._id, onReact],
  );

  const handleDelete = useCallback(() => {
    onDelete(message._id);
  }, [message._id, onDelete]);

  const toggleActions = useCallback(() => {
    setShowActions(!showActions);
  }, [showActions]);

  const toggleReactions = useCallback(() => {
    setShowReactions(!showReactions);
  }, [showReactions]);

  const startEdit = useCallback(() => {
    setIsEditing(true);
    setShowActions(false);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(
      typeof message.content === "string"
        ? message.content
        : typeof message.content === "object"
          ? JSON.stringify(message.content)
          : message.content || "",
    );
  }, [message.content]);

  const handleEditChange = useCallback((e) => {
    setEditContent(e.target.value);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEdit();
      } else if (e.key === "Escape") {
        cancelEdit();
      }
    },
    [handleEdit, cancelEdit],
  );

  const getFileIcon = useCallback((fileName) => {
    const ext = fileName?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📄";
    if (["doc", "docx"].includes(ext)) return "📝";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    return "📎";
  }, []);

  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return "";
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)}KB`;
    return `${Math.round(kb / 1024)}MB`;
  }, []);

  return (
    <div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} group ${
        showAvatar ? "mb-4" : "mb-1"
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar - enhanced styling */}
      {!isOwn && (
        <div className="flex-shrink-0 mr-3">
          {showAvatar ? (
            otherParticipant?.image ? (
              <img
                src={otherParticipant.image}
                alt={otherParticipant.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                <span className="text-white font-semibold text-sm">
                  {(() => {
                    // Enhanced avatar initial generation
                    if (!otherParticipant) return "?";

                    const name =
                      otherParticipant.name ||
                      otherParticipant.displayName ||
                      otherParticipant.email;
                    if (!name || typeof name !== "string") return "?";

                    const cleanName = name.trim();
                    if (cleanName.length === 0) return "?";

                    const firstWord = cleanName.split(" ")[0];
                    return firstWord.charAt(0).toUpperCase();
                  })()}
                </span>
              </div>
            )
          ) : (
            // Invisible spacer to maintain alignment for consecutive messages
            <div className="w-9 h-9"></div>
          )}
        </div>
      )}

      {/* Message bubble with enhanced styling */}
      <div
        className={`relative max-w-xs lg:max-w-md ${
          isOwn ? "ml-auto" : "mr-auto"
        }`}
      >
        {/* Enhanced actions menu */}
        {showActions && !isEditing && (
          <div
            className={`absolute top-0 ${
              isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
            } flex items-center space-x-1 bg-white shadow-xl rounded-full px-3 py-2 z-10 border border-gray-100`}
          >
            <button
              onClick={toggleReactions}
              className="p-1.5 text-gray-500 hover:text-yellow-500 rounded-full hover:bg-yellow-50 transition-all duration-200"
            >
              <span className="text-base">😊</span>
            </button>
            {isOwn && (
              <>
                <button
                  onClick={startEdit}
                  className="p-1.5 text-gray-500 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Enhanced reactions selector */}
        {showReactions && (
          <div
            className={`absolute top-0 ${
              isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
            } bg-white shadow-xl rounded-2xl px-4 py-3 flex items-center space-x-3 z-20 border border-gray-100 backdrop-blur-sm`}
          >
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="hover:scale-125 transition-all duration-200 text-xl p-1 rounded-full hover:bg-gray-50"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Enhanced message bubble */}
        <div
          className={`rounded-3xl px-5 py-3 ${
            isOwn
              ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg"
              : "bg-white text-gray-900 border border-gray-100 shadow-md"
          } transition-all duration-200 hover:shadow-lg`}
        >
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={handleEditChange}
                onKeyDown={handleKeyDown}
                className="w-full p-3 border border-gray-200 rounded-2xl text-gray-900 resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm bg-green-500 text-white rounded-full hover:bg-green-600 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.type === "image" && message.fileUrl && (
                <div className="mb-3">
                  <img
                    src={message.fileUrl}
                    alt="Shared image"
                    className="rounded-2xl max-w-full h-auto shadow-sm"
                    style={{ maxHeight: "300px" }}
                  />
                </div>
              )}

              {message.type === "file" && message.fileUrl && (
                <div className="mb-3 p-4 bg-gray-50 rounded-2xl flex items-center space-x-3 border border-gray-100">
                  <span className="text-3xl">
                    {getFileIcon(message.fileName)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {message.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(message.fileSize)}
                    </p>
                  </div>
                  <a
                    href={message.fileUrl}
                    download={message.fileName}
                    className="p-2 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-all duration-200"
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
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </a>
                </div>
              )}

              <p className="whitespace-pre-wrap break-words leading-relaxed">
                {typeof message.content === "string"
                  ? message.content
                  : typeof message.content === "object"
                    ? JSON.stringify(message.content)
                    : message.content || ""}
              </p>

              {/* Enhanced message reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {message.reactions.map((reaction, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full shadow-sm border border-gray-200"
                    >
                      {typeof reaction.emoji === "string"
                        ? reaction.emoji
                        : "👍"}{" "}
                      {reaction.count || 1}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Enhanced timestamp */}
        {showAvatar && (
          <div
            className={`text-xs text-gray-400 mt-2 ${
              isOwn ? "text-right" : "text-left"
            }`}
          >
            {message.editedAt && <span className="italic">edited • </span>}
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(MessageBubble);
