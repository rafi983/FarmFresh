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
      // FIX: Pass more specific farmer filtering parameters to get only THIS farmer's products AND orders
      const productsParams = {
        includeInactive: true,
        // Pass BOTH farmerId and farmerEmail for precise filtering
        farmerId: userIds?.userId, // This will be null/undefined for hardcoded farmers
        farmerEmail: userIds?.userEmail, // This is the email from session
        // Remove limit to get all farmer's products (not just 12)
        limit: 1000, // High limit to get all farmer's products
      };

      // FIX: Also filter orders by farmer to get only THIS farmer's orders
      const ordersParams = {
        farmerId: userIds?.userId, // Pass farmerId for orders too
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
    // Update dashboard cache
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

    // CRITICAL FIX: Update ALL products queries with different filter combinations
    const allProductsQueries = queryClient.getQueryCache().findAll({
      queryKey: ["products"],
    });

    allProductsQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (oldData) => {
        if (!oldData?.products) return oldData;

        const updatedProducts = oldData.products.map((product) =>
          product._id === productId || product.id === productId
            ? { ...product, ...updatedProduct }
            : product,
        );

        return {
          ...oldData,
          products: updatedProducts,
        };
      });
    });

    // AGGRESSIVE FIX: Force immediate refetch with multiple strategies
    setTimeout(() => {
      // Strategy 1: Force refetch all products queries
      allProductsQueries.forEach((query) => {
        queryClient.refetchQueries({
          queryKey: query.queryKey,
          type: "active",
        });
      });

      // Strategy 2: Clear and invalidate
      queryClient.removeQueries({
        queryKey: ["products"],
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ["products"],
        exact: false,
        refetchType: "active",
      });
    }, 100); // Small delay to ensure cache updates are complete
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
          }

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // SYNC WITH PRODUCTS PAGE: Update products page cache too - ENHANCED to handle all cases
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

              // If product is being deactivated, remove from public products page
              if (updateData.status === "inactive") {
                return null; // Mark for removal
              }

              return updatedProduct;
            })
            .filter(Boolean); // Remove null entries (deactivated products)

          return {
            ...oldData,
            products: updatedProducts,
            pagination: oldData.pagination
              ? {
                  ...oldData.pagination,
                  // Update total count if products were removed
                  total:
                    oldData.pagination.total -
                    (oldData.products.length - updatedProducts.length),
                }
              : undefined,
          };
        });
      });

      if (updateData.status === "active") {
        productsQueryKeys.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData) => {
            if (!oldData?.products) return oldData;

            // Get the activated products from dashboard cache
            const dashboardData = queryClient.getQueryData([
              "dashboard",
              userIds?.userId,
              userIds?.userEmail,
            ]);

            if (dashboardData?.products) {
              const activatedProducts = dashboardData.products.filter(
                (p) =>
                  productIds.includes(p._id || p.id) && p.status === "active",
              );

              // Add activated products to products page cache if they don't exist
              const existingIds = oldData.products.map((p) => p._id || p.id);
              const newProducts = activatedProducts.filter(
                (p) => !existingIds.includes(p._id || p.id),
              );

              if (newProducts.length > 0) {
                const combinedProducts = [...newProducts, ...oldData.products];

                return {
                  ...oldData,
                  products: combinedProducts,
                  pagination: oldData.pagination
                    ? {
                        ...oldData.pagination,
                        total:
                          (oldData.pagination.total || 0) + newProducts.length,
                      }
                    : undefined,
                };
              }
            }

            return oldData;
          });
        });
      }

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

      // SYNC WITH UNIFIED PRODUCTS PAGE CACHE: Also remove from unified products cache
      const unifiedProductsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products", "all"],
      });

      unifiedProductsQueryKeys.forEach((query) => {
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
              total: Math.max((oldData.meta?.total || 0) - 1, 0),
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

  // Function to add product with optimistic updates (FIXED VERSION)
  const addProduct = async (productData) => {
    try {
      // Generate a truly unique temporary ID
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

      // OPTIMISTIC UPDATE: Add the product to dashboard cache immediately
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          // FIXED: Check for duplicates before adding
          const productExists = oldData.products.some(
            (p) =>
              p.name === optimisticProduct.name &&
              p.farmerId === optimisticProduct.farmerId &&
              p.createdAt === optimisticProduct.createdAt,
          );

          if (productExists) {
            console.log(
              "⚠️ Duplicate product detected, skipping optimistic update",
            );
            return oldData;
          }

          return {
            ...oldData,
            products: [optimisticProduct, ...oldData.products],
          };
        },
      );

      // FIXED: Update unified products page cache with proper duplicate checking
      const unifiedProductsQueryKeys = queryClient.getQueryCache().findAll({
        queryKey: ["products", "all"],
      });

      unifiedProductsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData?.products) return oldData;

          // FIXED: Check for duplicates in unified products page cache too
          const productExists = oldData.products.some(
            (p) =>
              p.name === optimisticProduct.name &&
              p.farmerId === optimisticProduct.farmerId &&
              p.createdAt === optimisticProduct.createdAt,
          );

          if (productExists) {
            console.log(
              "⚠️ Product already exists in unified products cache, skipping",
            );
            return oldData;
          }

          const updatedProducts = [optimisticProduct, ...oldData.products];

          return {
            ...oldData,
            products: updatedProducts,
            meta: {
              ...oldData.meta,
              total: (oldData.meta?.total || 0) + 1,
            },
          };
        });
      });

      // Call the API to create the actual product
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        // ROLLBACK: Remove the optimistic product on API failure

        queryClient.setQueryData(
          ["dashboard", userIds?.userId, userIds?.userEmail],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              products: oldData.products.filter((p) => p._id !== tempId),
            };
          },
        );

        unifiedProductsQueryKeys.forEach((query) => {
          queryClient.setQueryData(query.queryKey, (oldData) => {
            if (!oldData?.products) return oldData;
            return {
              ...oldData,
              products: oldData.products.filter((p) => p._id !== tempId),
              meta: {
                ...oldData.meta,
                total: Math.max((oldData.meta?.total || 1) - 1, 0),
              },
            };
          });
        });

        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      const result = await response.json();
      const realProductId = result.productId;

      const finalProduct = {
        ...productData,
        _id: realProductId,
        id: realProductId,
        createdAt: currentTime,
        updatedAt: currentTime,
        status: "active",
        averageRating: 0,
        totalReviews: 0,
        reviewCount: 0,
        purchaseCount: 0,
      };

      // FIXED: Replace temp product with real product - better logic
      queryClient.setQueryData(
        ["dashboard", userIds?.userId, userIds?.userEmail],
        (oldData) => {
          if (!oldData) return oldData;

          const updatedProducts = oldData.products.map((product) => {
            // FIXED: Only replace if it's the exact temp product we created
            if (product._id === tempId && product.id === tempId) {
              return finalProduct;
            }
            return product;
          });

          // SAFETY CHECK: If temp product wasn't found, add the real product
          const tempProductFound = oldData.products.some(
            (p) => p._id === tempId,
          );
          if (!tempProductFound) {
            console.log(
              "⚠️ Temp product not found, adding real product directly",
            );
            return {
              ...oldData,
              products: [finalProduct, ...oldData.products],
            };
          }

          return {
            ...oldData,
            products: updatedProducts,
          };
        },
      );

      // FIXED: Update unified products page caches with real product
      unifiedProductsQueryKeys.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData) => {
          if (!oldData?.products) return oldData;

          const updatedProducts = oldData.products.map((product) => {
            // FIXED: Only replace if it's the exact temp product we created
            if (product._id === tempId && product.id === tempId) {
              return finalProduct;
            }
            return product;
          });

          // SAFETY CHECK: If temp product wasn't found, add the real product
          const tempProductFound = oldData.products.some(
            (p) => p._id === tempId,
          );
          if (!tempProductFound) {
            console.log(
              "⚠️ Temp product not found in products cache, adding real product",
            );
            return {
              ...oldData,
              products: updatedProducts,
              pagination: oldData.pagination
                ? {
                    ...oldData.pagination,
                    total: (oldData.pagination.total || 0) + 1,
                  }
                : undefined,
            };
          }

          return {
            ...oldData,
            products: updatedProducts,
          };
        });
      });

      return {
        success: true,
        productId: realProductId,
        product: finalProduct,
      };
    } catch (error) {
      console.error("❌ Error in addProduct:", error);

      // Additional cleanup on error
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });

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
