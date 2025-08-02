// hooks/useFarmerOrders.js
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useCallback } from "react";

export function useFarmerOrders() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const getUserIdentifiers = () => {
    if (!session?.user) return null;
    const user = session.user;
    return {
      userId: user.userId || user.id || user._id,
      userEmail: user.email,
    };
  };

  const userIds = getUserIdentifiers();

  const {
    data: orders = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["farmer-orders", userIds?.userId, userIds?.userEmail],
    queryFn: async () => {
      if (!userIds?.userId && !userIds?.userEmail) {
        throw new Error("No user identification found");
      }

      const params = new URLSearchParams();
      if (userIds.userId) params.append("farmerId", userIds.userId);
      if (userIds.userEmail) params.append("farmerEmail", userIds.userEmail);

      const response = await fetch(`/api/orders?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.orders || [];
    },
    enabled: !!session?.user && (!!userIds?.userId || !!userIds?.userEmail),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });

  // Function to invalidate and refetch orders
  const refreshOrders = () => {
    return queryClient.invalidateQueries({
      queryKey: ["farmer-orders", userIds?.userId, userIds?.userEmail],
    });
  };

  // Function to manually refetch
  const refetchOrders = () => {
    return refetch();
  };

  // Function to update specific order in cache
  const updateOrderInCache = useCallback(
    (orderId, newStatus, updatedOrder) => {
      queryClient.setQueryData(
        ["farmer-orders", userIds?.userId, userIds?.userEmail],
        (oldOrders) => {
          if (!oldOrders) return oldOrders;

          return oldOrders.map((order) =>
            order._id === orderId || order.id === orderId
              ? { ...order, status: newStatus, ...updatedOrder }
              : order,
          );
        },
      );
    },
    [queryClient, userIds?.userId, userIds?.userEmail],
  );

  return {
    orders,
    isLoading,
    error,
    isRefetching,
    refetch: refetchOrders,
    refreshOrders,
    updateOrderInCache,
  };
}
