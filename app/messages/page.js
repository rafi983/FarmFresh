"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMessaging } from "@/contexts/MessagingContext";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import Loading from "@/components/Loading";

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    isLoading,
    fetchConversations,
  } = useMessaging();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (status === "loading" || isLoading) {
    return <Loading />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header with title */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
      </div>

      {/* Main messaging area */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full px-4 py-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
            <div className="flex h-full">
              {/* Conversation List */}
              <div
                className={`${
                  isMobile
                    ? activeConversation
                      ? "hidden"
                      : "w-full"
                    : "w-80 border-r border-gray-200"
                }`}
              >
                <ConversationList
                  conversations={conversations}
                  activeConversation={activeConversation}
                  onSelectConversation={setActiveConversation}
                  isMobile={isMobile}
                />
              </div>

              {/* Chat Window */}
              <div
                className={`${
                  isMobile
                    ? activeConversation
                      ? "w-full"
                      : "hidden"
                    : "flex-1"
                }`}
              >
                {activeConversation ? (
                  <ChatWindow
                    conversation={activeConversation}
                    onBack={() => setActiveConversation(null)}
                    isMobile={isMobile}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg
                          className="w-12 h-12 text-gray-400"
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
                      <h3 className="text-xl font-medium text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-500">
                        Choose from your existing conversations or start a new
                        one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
