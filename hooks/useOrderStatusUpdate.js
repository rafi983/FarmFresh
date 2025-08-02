// hooks/useOrderStatusUpdate.js
"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

export function useOrderStatusUpdate() {
  const [updating, setUpdating] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const updateOrderStatus = useCallback(
    async (orderId, newStatus, additionalData = {}) => {
      if (!orderId || !newStatus) {
        throw new Error("Order ID and status are required");
      }

      setUpdating(true);

      try {
        // Prepare the update payload
        const updatePayload = {
          status: newStatus,
          statusHistory: {
            status: newStatus,
            timestamp: new Date().toISOString(),
            updatedBy: "farmer", // Could be dynamic based on user role
          },
          ...additionalData,
        };

        // Call the API to update the order
        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const result = await response.json();

        // Get user identifiers for cache invalidation
        const user = session?.user;
        if (user) {
          const userId = user.userId || user.id || user._id;
          const userEmail = user.email;

          // Invalidate both dashboard and farmer orders queries to trigger refetch
          console.log(
            `Invalidating caches for order update: ${orderId} -> ${newStatus}`,
          );

          // Invalidate dashboard cache
          await queryClient.invalidateQueries({
            queryKey: ["dashboard", userId, userEmail],
          });

          // Invalidate farmer orders cache
          await queryClient.invalidateQueries({
            queryKey: ["farmer-orders", userId, userEmail],
          });

          // Also update the specific order in both caches optimistically
          const updateOrderInCache = (cacheKey) => {
            queryClient.setQueryData(cacheKey, (oldData) => {
              if (!oldData) return oldData;

              // Handle dashboard data structure
              if (oldData.orders) {
                const updatedOrders = oldData.orders.map((order) =>
                  order._id === orderId || order.id === orderId
                    ? { ...order, status: newStatus, ...result.order }
                    : order,
                );

                return {
                  ...oldData,
                  orders: updatedOrders,
                };
              }

              // Handle farmer orders data structure (direct array)
              if (Array.isArray(oldData)) {
                return oldData.map((order) =>
                  order._id === orderId || order.id === orderId
                    ? { ...order, status: newStatus, ...result.order }
                    : order,
                );
              }

              return oldData;
            });
          };

          updateOrderInCache(["dashboard", userId, userEmail]);
          updateOrderInCache(["farmer-orders", userId, userEmail]);

          console.log(
            "Both dashboard and farmer orders caches invalidated and updated successfully",
          );
        }

        return result;
      } catch (error) {
        console.error("Failed to update order status:", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [queryClient, session?.user],
  );

  return {
    updateOrderStatus,
    updating,
  };
}
