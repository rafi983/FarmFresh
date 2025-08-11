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

          const updatedProducts = oldData.products
            .map((product) => {
              const shouldUpdate = productIds.includes(
                product._id || product.id,
              );
              if (!shouldUpdate) return product;

              const updatedProduct = { ...product, ...updateData };

              // If product is being deactivated, it should be removed from public products page
              if (updateData.status === "inactive") {
                return null; // Mark for removal
              }

              return updatedProduct;
            })
            .filter(Boolean); // Remove null entries (deactivated products)

          // If a product was activated, we need to check if it should be added
          // This handles the case where an inactive product becomes active
          const shouldAddActivatedProducts = updateData.status === "active";

          if (shouldAddActivatedProducts) {
            // For now, let the background refresh handle adding activated products
            // to avoid complex logic here
          }

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // SYNC WITH PRODUCTS PAGE: Update products page cache too - Fixed to handle all filter variations
      const productsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products"],
      });

      productsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData?.products) return oldData;

          const updatedProducts = oldData.products
            .map((product) => {
              const shouldUpdate = productIds.includes(
                product._id || product.id,
              );
              if (!shouldUpdate) return product;

              const updatedProduct = { ...product, ...updateData };

              // If product is being deactivated, it should be removed from public products page
              if (updateData.status === "inactive") {
                return null; // Mark for removal
              }

              return updatedProduct;
            })
            .filter(Boolean); // Remove null entries (deactivated products)

          // If a product was activated, we need to check if it should be added
          // This handles the case where an inactive product becomes active
          const shouldAddActivatedProducts = updateData.status === "active";

          if (shouldAddActivatedProducts) {
            // For now, let the background refresh handle adding activated products
            // to avoid complex logic here
          }

          return {
            ...oldData,
            products: updatedProducts,
          };
        });
      });

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

      // Also revert products page cache
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
      // OPTIMISTIC UPDATE: Remove the product from dashboard cache immediately
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.filter(
            (product) => product._id !== productId && product.id !== productId,
          );

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // SYNC WITH PRODUCTS PAGE: Also remove from products page cache - Fixed to handle all filter variations
      const productsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products"],
      });

      productsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData?.products) return oldData;

          const filteredProducts = oldData.products.filter(
            (product) => product._id !== productId && product.id !== productId,
          );

          return {
            ...oldData,
            products: filteredProducts,
            meta: {
              ...oldData.meta,
              total: filteredProducts.length,
            },
          };
        });
      });

      // Call the API
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        throw new Error(errorData.error || "Failed to delete product");
      }

      const result = await response.json();

      if (!result.success && !result.message) {
        throw new Error(result.error || "Failed to delete product");
      }

      // Clear API service caches
      if (apiService.clearProductsCache) {
        apiService.clearProductsCache();
      }

      // Set a delayed background refresh to sync with server data
      setTimeout(async () => {
        queryClient.invalidateQueries({
          queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
          exact: true,
          refetchType: "none",
        });

        queryClient.invalidateQueries({
          queryKey: ["products"],
          exact: false,
          refetchType: "none",
        });
      }, 5000);

      return { success: true };
    } catch (error) {
      console.error("❌ [Dashboard] Product deletion failed:", error);

      // If API call failed, revert the optimistic update by refetching both caches
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
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

  // Function to add product with optimistic updates (similar to bulkUpdateProducts and deleteProduct)
  const addProduct = async (productData) => {
    try {
      // Generate a temporary ID for optimistic update
      const tempId = `temp_${Date.now()}`;
      const optimisticProduct = {
        ...productData,
        _id: tempId,
        id: tempId,
      };

      // OPTIMISTIC UPDATE: Add the product to dashboard cache immediately
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            products: [...oldData.products, optimisticProduct],
          };
        },
      );

      // SYNC WITH PRODUCTS PAGE: Also add to products page cache - Fixed to handle all filter variations
      const productsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products"],
      });

      productsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData) return oldData;

          // Only add to products page cache if the product should be visible in public context
          // (i.e., only add active products to products page cache)
          const shouldAddToPublicCache = optimisticProduct.status === "active";

          if (!shouldAddToPublicCache) {
            // Don't add inactive products to the public products page cache
            return oldData;
          }

          return {
            ...oldData,
            products: [...oldData.products, optimisticProduct],
            meta: {
              ...oldData.meta,
              total: (oldData.meta?.total || 0) + 1,
            },
          };
        });
      });

      // Call the API
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      const result = await response.json();

      const finalProduct = {
        ...productData,
        _id: result.productId,
        id: result.productId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        averageRating: 0,
        totalReviews: 0,
        reviewCount: 0,
        purchaseCount: 0,
      };

      // Update dashboard cache with real product data (replace temp with actual)
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.map((product) =>
            product._id === tempId || product.id === tempId
              ? finalProduct
              : product,
          );

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // Update products page cache with real product data too - Fixed to handle all filter variations
      const productsQueryKeysForUpdate = queryClient.getQueryCache().findAll({
        queryKey: ["products"],
      });

      productsQueryKeysForUpdate.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.map((product) =>
            product._id === tempId || product.id === tempId
              ? finalProduct
              : product,
          );

          return {
            ...oldData,
            products: updatedProducts,
          };
        });
      });

      // Clear API service caches
      if (apiService.clearProductsCache) {
        apiService.clearProductsCache();
      }

      // Set a delayed background refresh to sync with server data
      setTimeout(async () => {
        queryClient.invalidateQueries({
          queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
          exact: true,
          refetchType: "none",
        });

        queryClient.invalidateQueries({
          queryKey: ["products"],
          exact: false,
          refetchType: "none",
        });
      }, 5000);

      return { success: true, productId: result.productId };
    } catch (error) {
      console.error("❌ [Dashboard] Product creation failed:", error);

      // If API call failed, revert the optimistic update by refetching both caches
      await queryClient.invalidateQueries({
        queryKey: ["dashboard", userIds?.userId, userIds?.userEmail],
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
