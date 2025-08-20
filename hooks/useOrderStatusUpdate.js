"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiService } from "@/lib/api-service";
import { recordOrderStatusOverride } from "@/lib/order-status-overrides";
import { computeFarmerScopedData } from "@/lib/order-farmer-utils";

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
        const updatePayload = {
          status: newStatus,
          statusHistory: {
            status: newStatus,
            at: new Date().toISOString(),
            note: "Updated by farmer",
          },
          ...additionalData,
        };

        const response = await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          let errorData = {};
          try {
            errorData = await response.json();
          } catch {}
          throw new Error(
            errorData.error ||
              `HTTP ${response.status}: ${response.statusText}`,
          );
        }

        const result = await response.json();
        const user = session?.user; // moved earlier usage

        // Optimistic UI update across all dashboard queries (even if session not ready)
        const dashboardQueries = queryClient.getQueriesData({
          queryKey: ["dashboard"],
        });
        dashboardQueries.forEach(([key]) => {
          queryClient.setQueryData(key, (oldData) => {
            if (!oldData || !Array.isArray(oldData.orders)) return oldData;
            return {
              ...oldData,
              orders: oldData.orders.map((o) => {
                if (!(o._id === orderId || o.id === orderId)) return o;
                const serverOrder = result.order || {};
                const existingIsFarmerScoped =
                  typeof o.farmerSubtotal === "number" ||
                  typeof o.stableFarmerSubtotal === "number";
                // Determine farmerEmail context from first item (fallback user email)
                const farmerEmailCtx =
                  o.items?.[0]?.farmerEmail ||
                  o.items?.[0]?.farmer?.email ||
                  user?.email;
                // Compute original stable subtotal once
                const originalStable =
                  o.stableFarmerSubtotal ??
                  (existingIsFarmerScoped ? (o.farmerSubtotal ?? null) : null);
                // If server includes items from other farmers but view is scoped keep original items
                const preservedItems =
                  existingIsFarmerScoped &&
                  serverOrder.items &&
                  serverOrder.items.length > o.items.length
                    ? o.items
                    : serverOrder.items || o.items;
                // Recompute scoped subtotal from preserved items (only if we don't already have stable value)
                let recomputed = originalStable;
                if (recomputed == null && farmerEmailCtx) {
                  const { stableFarmerSubtotal } = computeFarmerScopedData(
                    {
                      ...serverOrder,
                      items: preservedItems,
                      farmerSubtotal: serverOrder.farmerSubtotal,
                    },
                    farmerEmailCtx,
                  );
                  recomputed = stableFarmerSubtotal;
                }
                return {
                  ...o,
                  ...serverOrder,
                  items: preservedItems,
                  farmerSubtotal:
                    typeof o.farmerSubtotal === "number"
                      ? o.farmerSubtotal
                      : serverOrder.farmerSubtotal,
                  stableFarmerSubtotal:
                    recomputed ??
                    o.stableFarmerSubtotal ??
                    serverOrder.farmerSubtotal,
                  status: newStatus, // force new status last
                };
              }),
            };
          });
        });

        // Record override to prevent transient reversion on first refetch
        recordOrderStatusOverride(orderId, newStatus);

        // Clear internal API caches so a manual fetch below is fresh
        if (apiService?.clearOrdersCache) {
          try {
            apiService.clearOrdersCache();
          } catch {}
        }

        // Manual fresh fetch (skipCache) to reconcile full order list without waiting for invalidation
        const userEmail = user?.email;
        if (userEmail) {
          try {
            const freshOrdersData = await apiService.getOrders(
              { farmerEmail: userEmail, limit: 1000, _bust: Date.now() },
              { skipCache: true },
            );
            const freshOrders = freshOrdersData?.orders || [];
            // Merge: ensure the updated order keeps newStatus
            queryClient.setQueryData(["dashboard", userEmail], (oldData) => {
              if (!oldData) return oldData;
              const merged = freshOrders.map((fo) =>
                fo._id === orderId || fo.id === orderId
                  ? { ...fo, status: newStatus }
                  : fo,
              );
              return { ...oldData, orders: merged };
            });
          } catch (e) {
            // fallback: schedule later invalidation
          }
        }

        // Schedule a delayed background invalidation to pick up any ancillary analytics changes
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }, 1500);

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

  return { updateOrderStatus, updating };
}
