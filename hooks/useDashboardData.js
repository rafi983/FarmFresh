// hooks/useDashboardData.js
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
      const [productsData, ordersData] = await Promise.all([
        apiService.getProducts({ includeInactive: true }),
        apiService.getOrders(),
      ]);

      const dashboardData = {
        products: productsData?.products || [],
        orders: ordersData?.orders || [],
        analytics: ordersData?.analytics || {},
        meta: productsData?.meta || {},
      };

      console.log("📊 Dashboard query result:", {
        productsCount: dashboardData.products.length,
        sampleProduct: dashboardData.products[0]
          ? {
              id: dashboardData.products[0]._id,
              name: dashboardData.products[0].name,
              stock: dashboardData.products[0].stock,
              price: dashboardData.products[0].price,
            }
          : null,
        timestamp: new Date().toISOString(),
      });

      // ADD DEBUG: Log ALL product data to see what we're actually getting
      console.log(
        "🔍 [DEBUG] ALL Dashboard products received from API:",
        dashboardData.products,
      );

      return {
        products: dashboardData.products || [],
        orders: dashboardData.orders || [],
        analytics: dashboardData.analytics || {},
        meta: dashboardData.meta || {},
      };
    },
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
  });

  // Add debug logging for the returned data
  console.log(
    "🔍 [DEBUG] Dashboard hook returning products:",
    data?.products?.length || 0,
  );
  if (data?.products?.length > 0) {
    console.log("🔍 [DEBUG] First product in dashboard:", {
      id: data.products[0]._id || data.products[0].id,
      name: data.products[0].name,
      stock: data.products[0].stock,
      price: data.products[0].price,
    });
  }

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

  // Enhanced bulk update function - MINIMAL fix to match products page behavior
  const bulkUpdateProducts = async (productIds, updateData) => {
    try {
      console.log("🔄 [Dashboard] Starting bulk product update...");

      // Step 1: Call API service
      const result = await apiService.bulkUpdateProducts(
        productIds,
        updateData,
      );

      // Step 2: Clear all caches immediately (same as products page)
      apiService.clearProductsCache();
      apiService.clearCache();

      // Step 3: Force immediate refetch of dashboard data
      console.log("🔄 [Dashboard] Forcing immediate data refetch...");
      const freshData = await refetch();

      // Step 4: Double-check the fresh data contains updated values
      if (freshData?.data?.products?.length > 0) {
        console.log("🔍 [Dashboard] Fresh data after refetch:", {
          productCount: freshData.data.products.length,
          firstProduct: {
            id: freshData.data.products[0]._id,
            name: freshData.data.products[0].name,
            stock: freshData.data.products[0].stock,
            price: freshData.data.products[0].price,
          },
        });
      }

      // Step 5: Also invalidate the dashboard query to trigger re-render
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
        exact: true,
      });

      console.log(
        "✅ [Dashboard] Bulk update completed with forced refetch and invalidation",
      );
      return result;
    } catch (error) {
      console.error("❌ [Dashboard] Bulk product update failed:", error);
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
    updateOrderInCache,
    updateProductInCache,
    updateBulkProductsInCache,
    bulkUpdateProducts,
  };
}
