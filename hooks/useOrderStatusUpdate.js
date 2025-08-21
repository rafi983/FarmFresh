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

        // Try to detect farmerEmail (scoped)
        let scopedFarmerEmail = updatePayload.farmerEmail;
        if (!scopedFarmerEmail) {
          // Look in cached dashboard queries
          const dashQueries = queryClient.getQueriesData({
            queryKey: ["dashboard"],
          });
          for (const [, data] of dashQueries) {
            const match = data?.orders?.find(
              (o) => o._id === orderId || o.id === orderId,
            );
            if (match) {
              scopedFarmerEmail =
                match.items?.[0]?.farmerEmail ||
                match.items?.[0]?.farmer?.email;
              break;
            }
          }
        }

        // Get current user's email if no scoped email found
        if (!scopedFarmerEmail && session?.user?.email) {
          scopedFarmerEmail = session.user.email;
        }

        if (scopedFarmerEmail) updatePayload.farmerEmail = scopedFarmerEmail;

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
        const user = session?.user;

        // Extract final status from server response to prevent flickering
        const finalServerStatus = result.order?.status;
        const finalFarmerStatuses = result.order?.farmerStatuses || {};

        // Get the order before update for comparison
        const dashboardQueries = queryClient.getQueriesData({
          queryKey: ["dashboard"],
        });

        // Optimistic UI update across all dashboard queries - USE SERVER STATE DIRECTLY
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
                const farmerEmailCtx =
                  scopedFarmerEmail ||
                  o.items?.[0]?.farmerEmail ||
                  o.items?.[0]?.farmer?.email ||
                  user?.email;

                const preservedItems = existingIsFarmerScoped
                  ? o.items
                  : serverOrder.items || o.items;

                let stable = o.stableFarmerSubtotal;
                if (stable == null && farmerEmailCtx) {
                  const { stableFarmerSubtotal } = computeFarmerScopedData(
                    { ...serverOrder, items: preservedItems },
                    farmerEmailCtx,
                  );
                  stable = stableFarmerSubtotal;
                }
                if (stable == null && typeof o.farmerSubtotal === "number") {
                  stable = o.farmerSubtotal;
                }

                const updatedOrder = {
                  ...o,
                  ...serverOrder,
                  items: preservedItems,
                  farmerStatuses: finalFarmerStatuses,
                  stableFarmerSubtotal: stable,
                  farmerSubtotal:
                    stable ?? o.farmerSubtotal ?? serverOrder.farmerSubtotal,
                  status: finalServerStatus || serverOrder.status || newStatus, // Server status takes absolute priority
                };

                return updatedOrder;
              }),
            };
          });
        });

        // Record override to prevent transient reversion on first refetch
        recordOrderStatusOverride(
          orderId,
          finalServerStatus || newStatus,
          scopedFarmerEmail,
        );

        // DISABLE delayed operations that cause flickering
        // Only invalidate if we don't have a definitive server status
        if (!finalServerStatus) {
          try {
            queryClient.invalidateQueries({
              queryKey: ["orders"],
              exact: false,
            });
          } catch (e) {
            console.warn("orders query invalidation failed", e);
          }
        }

        // Clear internal API caches
        if (apiService?.clearOrdersCache) {
          try {
            apiService.clearOrdersCache();
          } catch {}
        }

        // DISABLE the fresh fetch if we have server status - it causes flickering
        // Manual fresh fetch (skipCache) to reconcile full order list without waiting for invalidation
        const userEmail = user?.email;
        if (userEmail && !finalServerStatus) {
          try {
            const freshOrdersData = await apiService.getOrders(
              { farmerEmail: userEmail, limit: 1000, _bust: Date.now() },
              { skipCache: true },
            );
            const freshOrders = freshOrdersData?.orders || [];

            queryClient.setQueryData(["dashboard", userEmail], (oldData) => {
              if (!oldData) return oldData;
              const merged = freshOrders.map((fo) => {
                if (fo._id === orderId || fo.id === orderId) {
                  const existing = oldData.orders.find(
                    (o) => o._id === orderId || o.id === orderId,
                  );
                  const stable = existing?.stableFarmerSubtotal;
                  const farmerStatuses = {
                    ...(fo.farmerStatuses || {}),
                    ...(existing?.farmerStatuses || {}),
                    ...(scopedFarmerEmail
                      ? { [scopedFarmerEmail]: newStatus }
                      : {}),
                  };

                  const mergedOrder = {
                    ...fo,
                    status: fo.status, // Use server status (could be mixed)
                    items: existing?.items || fo.items,
                    farmerStatuses,
                    stableFarmerSubtotal:
                      stable ?? existing?.farmerSubtotal ?? fo.farmerSubtotal,
                    farmerSubtotal:
                      stable ?? existing?.farmerSubtotal ?? fo.farmerSubtotal,
                  };

                  return mergedOrder;
                }
                return fo;
              });
              return { ...oldData, orders: merged };
            });
          } catch (e) {
            console.error("Fresh fetch failed:", e);
          }
        }

        return result;
      } catch (error) {
        console.error("❌ [STATUS UPDATE FAILED]", error);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [queryClient, session?.user],
  );

  return { updateOrderStatus, updating };
}
