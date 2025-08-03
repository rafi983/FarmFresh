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
      if (!userIds?.userId && !userIds?.userEmail) {
        throw new Error("No user identification found");
      }

      const dashboardData = await apiService.getDashboardData(
        userIds.userId,
        userIds.userEmail,
        { forceRefresh: true },
      );

      return {
        products: dashboardData.products || [],
        orders: dashboardData.orders || [],
        analytics: dashboardData.analytics || {},
        meta: dashboardData.meta || {},
      };
    },
    enabled: !!session?.user && (!!userIds?.userId || !!userIds?.userEmail),
    staleTime: 2 * 60 * 1000, // 2 minutes for dashboard data
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
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

  // Function to bulk update multiple products in cache without full refetch
  const updateBulkProductsInCache = (productIds, updateData) => {
    queryClient.setQueryData(
      ["dashboard", userIds?.userId, userIds?.userEmail],
      (oldData) => {
        if (!oldData) return oldData;

        const updatedProducts = oldData.products.map((product) => {
          const productId = product._id || product.id;
          if (productIds.includes(productId)) {
            return {
              ...product,
              ...updateData,
              updatedAt: new Date().toISOString(),
            };
          }
          return product;
        });

        return {
          ...oldData,
          products: updatedProducts,
        };
      },
    );
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
  };
}
