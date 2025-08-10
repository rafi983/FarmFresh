"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiService } from "@/lib/api-service";

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
    queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
    queryFn: async () => {
      console.log("🔍 Dashboard query executing - fetching fresh data...");

      // FIX: Pass farmer filtering parameters to get only THIS farmer's products AND orders
      const productsParams = {
        includeInactive: true,
        // Filter by farmer using their email or ID
        farmerEmail: userIds?.userEmail,
        // Remove limit to get all farmer's products (not just 12)
        limit: 1000, // High limit to get all farmer's products
      };

      // FIX: Also filter orders by farmer to get only THIS farmer's orders
      const ordersParams = {
        farmerEmail: userIds?.userEmail,
        limit: 1000, // High limit to get all farmer's orders
      };

      const [productsData, ordersData] = await Promise.all([
        apiService.getProducts(productsParams),
        apiService.getOrders(ordersParams), // Add farmer filtering to orders too
      ]);

      const dashboardData = {
        products: productsData?.products || [],
        orders: ordersData?.orders || [],
        analytics: ordersData?.analytics || {},
        meta: productsData?.meta || {},
      };

      return {
        products: dashboardData.products || [],
        orders: dashboardData.orders || [],
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
      queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
    });
  };

  // Function to manually refetch
  const refetchDashboard = () => {
    return refetch();
  };

  // Function to update specific order in cache without full refetch
  const updateOrderInCache = (orderId, newStatus, updatedOrder) => {
    queryClient.setQueryData(
      ["dashboard", userIds?.userId, userIds?.userEmail],
      (oldData) => {
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
      },
    );
  };

  // Function to update specific product in cache without full refetch
  const updateProductInCache = (productId, updatedProduct) => {
    queryClient.setQueryData(
      ["dashboard", userIds?.userId, userIds?.userEmail],
      (oldData) => {
        if (!oldData) return oldData;

        const updatedProducts = oldData.products.map((product) =>
          product._id === productId || product.id === productId
            ? { ...product, ...updatedProduct }
            : product,
        );

        return {
          ...oldData,
          products: updatedProducts,
        };
      },
    );
  };

  // Function to update multiple products in cache (bulk update)
  const updateBulkProductsInCache = (productIds, updateData) => {
    queryClient.setQueryData(
      ["dashboard", userIds?.userId, userIds?.userEmail],
      (oldData) => {
        if (!oldData) return oldData;

        const updatedProducts = oldData.products.map((product) =>
          productIds.includes(product._id || product.id)
            ? { ...product, ...updateData }
            : product,
        );

        return {
          ...oldData,
          products: updatedProducts,
        };
      },
    );
  };

  // Simple bulk update function - Fixed to maintain optimistic updates properly
  const bulkUpdateProducts = async (productIds, updateData) => {
    try {
      // OPTIMISTIC UPDATE: Update the cache immediately to prevent UI flickering
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.map((product) => {
            const shouldUpdate = productIds.includes(product._id || product.id);
            return shouldUpdate ? { ...product, ...updateData } : product;
          });

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // Call the API
      const result = await apiService.bulkUpdateProducts(
        productIds,
        updateData,
      );

      // Clear API service caches but keep React Query optimistic updates
      if (apiService.clearProductsCache) {
        apiService.clearProductsCache();
      }

      // Set a delayed background refresh to sync with server data without disrupting UI
      setTimeout(async () => {
        // Only invalidate with refetchType: "none" to mark as stale but keep current data
        queryClient.invalidateQueries({
          queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
          exact: true,
          refetchType: "none", // Don't refetch immediately - keep optimistic updates
        });

        // Invalidate other product queries for consistency across the app
        queryClient.invalidateQueries({
          queryKey: ["products"],
          exact: false,
          refetchType: "none", // Don't refetch immediately
        });
      }, 5000); // Wait 5 seconds before background sync
      return result;
    } catch (error) {
      console.error("❌ [Dashboard] Bulk product update failed:", error);

      // If API call failed, revert the optimistic update
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
        exact: true,
        refetchType: "active", // Force refetch to get correct data on error
      });

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
  };
}
