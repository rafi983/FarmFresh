import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMessaging } from "@/contexts/MessagingContext";
import toast from "react-hot-toast";

export default function MessageButton({
  recipientId,
  recipientName,
  recipientType = "farmer",
  productName = null,
  className = "",
  variant = "primary", // primary, secondary, icon
}) {
  const { data: session } = useSession();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { sendMessage, startConversation } = useMessaging();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartConversation = async () => {
    // Use AuthContext first, then fallback to NextAuth session
    const currentUser = user || session?.user;

    // More detailed user ID extraction
    let extractedUserId = null;
    if (currentUser) {
      extractedUserId =
        currentUser.id ||
        currentUser._id ||
        currentUser.userId ||
        currentUser.sub ||
        currentUser.email; // fallback to email as identifier
    }

    if (!isAuthenticated && !session?.user) {
      toast.error("Please login to start a conversation");
      router.push("/login");
      return;
    }

    if (!extractedUserId) {
      console.error("❌ No user ID found:", {
        user,
        session: session?.user,
        currentUser,
        allUserKeys: currentUser ? Object.keys(currentUser) : "no user object",
      });
      toast.error(
        "User information not available. Please try refreshing the page.",
      );
      return;
    }

    if (extractedUserId === recipientId) {
      toast.error("You cannot message yourself");
      return;
    }

    setIsLoading(true);

    try {
      // Send initial message to create conversation
      const initialMessage = productName
        ? `Hi! I'm interested in your product: ${productName}`
        : `Hi! I'd like to connect with you.`;

      const result = await sendMessage(recipientId, initialMessage);

      if (result) {
        router.push("/messages");
        toast.success("Message sent! Redirecting to messages...");
      } else {
        throw new Error("Failed to send message - no result returned");
      }
    } catch (error) {
      console.error("❌ Error starting conversation:", error);
      toast.error(`Failed to start conversation: ${error.message}`);

      // Fallback: redirect to messages anyway so user can try manually
      router.push("/messages");
    } finally {
      setIsLoading(false);
    }
  };

  // Check authentication status using both contexts
  const isLoggedIn = isAuthenticated || !!session?.user;
  const currentUser = user || session?.user;

  if (!isLoggedIn) {
    return (
      <button
        onClick={() => router.push("/login")}
        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${className}`}
      >
        <svg
          className="w-4 h-4 mr-2"
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
        Login to Message
      </button>
    );
  }

  const getButtonClasses = () => {
    const baseClasses =
      "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

    switch (variant) {
      case "secondary":
        return `${baseClasses} px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-green-500`;
      case "icon":
        return `${baseClasses} p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 focus:ring-green-500`;
      default:
        return `${baseClasses} px-4 py-2 text-sm border border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500`;
    }
  };

  return (
    <button
      onClick={handleStartConversation}
      disabled={isLoading}
      className={`${getButtonClasses()} ${className}`}
      title={`Message ${recipientName}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {variant !== "icon" && "Sending..."}
        </>
      ) : (
        <>
          <svg
            className={`w-4 h-4 ${variant !== "icon" ? "mr-2" : ""}`}
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
          {variant !== "icon" &&
            `Message ${recipientType === "farmer" ? "Farmer" : "Customer"}`}
        </>
      )}
    </button>
  );
}
