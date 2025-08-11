import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export const useMessagingQuery = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["messaging", "conversations", session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !!session?.user?.id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for real-time updates
  });
};

export const useConversationQuery = (conversationId) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ["messaging", "messages", conversationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/messages?conversationId=${conversationId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!conversationId && !!session?.user?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 10, // Refetch every 10 seconds for real-time messages
  });
};
