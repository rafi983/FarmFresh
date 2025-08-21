"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiService } from "@/lib/api-service";
import { applyOrderStatusOverrides } from "@/lib/order-status-overrides";
import {
  computeFarmerScopedData,
  mergePreserveMedia,
} from "@/lib/order-farmer-utils";
import {
  updateProductAcrossCaches,
  bulkUpdateProductsAcrossCaches,
  addOptimisticProduct,
  replaceTempProduct,
  removeProductAcrossCaches,
  invalidateProductsAndDashboard,
} from "@/lib/product-cache-utils";

export function useDashboardData() {
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

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard", userIds?.userEmail],
    queryFn: async () => {
      const productsParams = {
        includeInactive: true,
        farmerEmail: userIds?.userEmail,
        limit: 1000,
      };
      const ordersParams = {
        farmerEmail: userIds?.userEmail,
        limit: 1000,
      };
      const [productsData, ordersData] = await Promise.all([
        apiService.getProducts(productsParams),
        apiService.getOrders(ordersParams),
      ]);

      const dashboardData = {
        products: productsData?.products || [],
        orders: ordersData?.orders || [],
        analytics: ordersData?.analytics || {},
        meta: productsData?.meta || {},
      };

      // Apply local status overrides (prevents optimistic flip then revert)
      let finalOrders = applyOrderStatusOverrides(
        dashboardData.orders,
        userIds?.userEmail,
      );

      // Merge with existing cached orders to preserve advanced local statuses
      const cached = queryClient.getQueryData([
        "dashboard",
        userIds?.userEmail,
      ]);
      if (cached?.orders?.length) {
        const statusRank = {
          pending: 0,
          confirmed: 1,
          shipped: 2,
          delivered: 3,
          cancelled: 3,
          returned: 3,
        };
        finalOrders = finalOrders.map((incoming) => {
          const local = cached.orders.find(
            (o) => o._id === incoming._id || o.id === incoming._id,
          );
          if (!local) return incoming;
          const lr = statusRank[(local.status || "").toLowerCase()] ?? -1;
          const ir = statusRank[(incoming.status || "").toLowerCase()] ?? -1;
          let merged = incoming;
          if (lr > ir) {
            merged = {
              ...incoming,
              status: local.status,
              farmerSubtotal:
                typeof local.farmerSubtotal === "number"
                  ? local.farmerSubtotal
                  : incoming.farmerSubtotal,
            };
          } else if (
            lr === ir &&
            typeof local.farmerSubtotal === "number" &&
            (incoming.farmerSubtotal == null ||
              Math.abs(incoming.farmerSubtotal - local.farmerSubtotal) <= 1)
          ) {
            merged = { ...incoming, farmerSubtotal: local.farmerSubtotal };
          }

          merged.farmerStatuses = {
            ...(local.farmerStatuses || {}),
            ...(incoming.farmerStatuses || {}), // Server data overrides cached data
          };

          const hasRecentOverride =
            window.farmfreshStatusOverrides &&
            Object.keys(window.farmfreshStatusOverrides).some((orderId) => {
              const override = window.farmfreshStatusOverrides[orderId];
              const isRecent =
                override && Date.now() - override.timestamp < 3000; // 3 seconds
              return isRecent && orderId === (incoming._id || incoming.id);
            });

          // If global status is mixed derive current farmer's scoped status
          // BUT NOT during active updates to prevent flickering
          if (
            merged.status === "mixed" &&
            userIds?.userEmail &&
            merged.farmerStatuses?.[userIds.userEmail] &&
            !hasRecentOverride // Don't override during recent updates
          ) {
            merged.status = merged.farmerStatuses[userIds.userEmail];
          }

          return merged;
        });
      }

      // Stabilize farmer-specific subtotal & media if farmer context
      if (userIds?.userEmail) {
        const cachedMap = new Map(
          (cached?.orders || []).map((o) => [o._id || o.id, o]),
        );
        finalOrders = finalOrders.map((o) => {
          const id = o._id || o.id;
          const prev = cachedMap.get(id);
          const { stableFarmerSubtotal, items } = computeFarmerScopedData(
            o,
            userIds.userEmail,
          );
          const resolvedStable =
            prev && typeof prev.stableFarmerSubtotal === "number"
              ? prev.stableFarmerSubtotal
              : stableFarmerSubtotal;
          return {
            ...o,
            items: mergePreserveMedia(prev?.items, items),
            stableFarmerSubtotal: resolvedStable,
            farmerStatuses: {
              ...(o.farmerStatuses || {}),
              ...(prev?.farmerStatuses || {}),
            },
          };
        });
      }

      return {
        products: dashboardData.products || [],
        orders: finalOrders || [],
        analytics: dashboardData.analytics || {},
        meta: dashboardData.meta || {},
      };
    },
    staleTime: 30 * 1000, // Keep data fresh for 30 seconds to allow optimistic updates
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch when component mounts - use cache
    refetchOnWindowFocus: false, // Don't refetch when window gets focus - use cache
    retry: 3,
    retryDelay: 1000,
  });

  // Function to invalidate and refetch dashboard data
  const refreshDashboard = () => {
    return queryClient.invalidateQueries({
      queryKey: ["dashboard", userIds?.userEmail],
    });
  };

  // Function to manually refetch
  const refetchDashboard = () => {
    return refetch();
  };

  // Function to update specific order in cache without full refetch
  const updateOrderInCache = (orderId, newStatus, updatedOrder) => {
    queryClient.setQueryData(["dashboard", userIds?.userEmail], (oldData) => {
      if (!oldData) return oldData;

      const updatedOrders = oldData.orders.map((order) =>
        order._id === orderId || order.id === orderId
          ? { ...order, status: newStatus, ...updatedOrder }
          : order,
      );

      return {
        ...oldData,
        orders: updatedOrders,
      };
    });
  };

  // Function to update specific product in cache without full refetch
  const updateProductInCache = (productId, updatedProduct) => {
    updateProductAcrossCaches(queryClient, productId, updatedProduct, [
      "dashboard",
      userIds?.userEmail,
    ]);
  };

  // Function to update multiple products in cache (bulk update)
  const updateBulkProductsInCache = (productIds, updateData) => {
    bulkUpdateProductsAcrossCaches(queryClient, productIds, updateData, [
      "dashboard",
      userIds?.userEmail,
    ]);
  };

  // Simple bulk update function - Fixed to maintain optimistic updates properly
  const bulkUpdateProducts = async (productIds, updateData) => {
    try {
      // Optimistic bulk update via shared util
      bulkUpdateProductsAcrossCaches(queryClient, productIds, updateData, [
        "dashboard",
        userIds?.userEmail,
      ]);
      const result = await apiService.bulkUpdateProducts(
        productIds,
        updateData,
      );
      if (apiService.clearProductsCache) apiService.clearProductsCache();
      setTimeout(() => invalidateProductsAndDashboard(queryClient), 5000);
      return result;
    } catch (error) {
      console.error("❌ [Dashboard] Bulk product update failed:", error);
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userEmail],
        exact: true,
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["products"],
        exact: false,
        refetchType: "active",
      });
      throw error;
    }
  };

  // Function to delete product with optimistic updates (similar to bulkUpdateProducts)
  const deleteProduct = async (productId) => {
    try {
      removeProductAcrossCaches(queryClient, productId, [
        "dashboard",
        userIds?.userEmail,
      ]);
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || "Failed to delete product");
      }

      if (apiService.clearProductsCache) apiService.clearProductsCache();
      setTimeout(() => invalidateProductsAndDashboard(queryClient), 5000);
      return { success: true };
    } catch (error) {
      console.error("❌ [Dashboard] Product deletion failed:", error);
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userEmail],
        exact: true,
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["products"],
        exact: false,
        refetchType: "active",
      });
      throw error;
    }
  };

  // Function to add product with optimistic updates (FIXED VERSION)
  const addProduct = async (productData) => {
    try {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentTime = new Date().toISOString();
      const optimisticProduct = {
        ...productData,
        _id: tempId,
        id: tempId,
        createdAt: currentTime,
        updatedAt: currentTime,
        status: "active",
        averageRating: 0,
        totalReviews: 0,
        reviewCount: 0,
        purchaseCount: 0,
      };
      addOptimisticProduct(queryClient, optimisticProduct, [
        "dashboard",
        userIds?.userEmail,
      ]);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        // rollback by invalidating
        await queryClient.invalidateQueries({
          queryKey: ["dashboard", userIds?.userEmail],
          exact: true,
          refetchType: "active",
        });
        await queryClient.invalidateQueries({
          queryKey: ["products"],
          exact: false,
          refetchType: "active",
        });
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      const result = await response.json();
      const realProductId = result.productId;
      const finalProduct = {
        ...optimisticProduct,
        _id: realProductId,
        id: realProductId,
      };
      replaceTempProduct(queryClient, tempId, finalProduct, [
        "dashboard",
        userIds?.userEmail,
      ]);
      return { success: true, productId: realProductId, product: finalProduct };
    } catch (error) {
      console.error("❌ Error in addProduct:", error);
      queryClient.invalidateQueries({ queryKey: ["dashboard"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["products"], exact: false });
      throw error;
    }
  };

  return {
    products: data?.products || [],
    orders: data?.orders || [],
    analytics: data?.analytics || {},
    meta: data?.meta || {},
    isLoading,
    error,
    isRefetching,
    refetch: refetchDashboard,
    refreshDashboard,
    bulkUpdateProducts,
    updateOrderInCache,
    updateProductInCache,
    updateBulkProductsInCache,
    deleteProduct,
    addProduct,
  };
}
