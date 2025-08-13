import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

// Query keys for React Query
export const PRODUCTS_QUERY_KEY = ["products"];

// Custom hook for products data
export function useProductsQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, filters],
    queryFn: async () => {
      const data = await apiService.getProducts(filters);
      return data;
    },
    staleTime: 1 * 60 * 1000, // Reduced to 1 minute for faster updates
    gcTime: 5 * 60 * 1000, // Reduced to 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
    ...options,
  });
}

// Enhanced utility functions for products cache management with optimistic updates
export function useProductsCache() {
  const queryClient = useQueryClient();

  return {
    // Invalidate products cache to trigger refetch
    invalidateProducts: () => {
      // Clear API service cache first
      apiService.clearProductsCache();
      apiService.clearFarmersCache(); // Also clear farmers since products contain farmer info

      // Invalidate ALL products queries regardless of their filter state
      // This ensures that any cached products data gets refreshed
      queryClient.invalidateQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false, // This will match ["products"] and ["products", {...filters}]
      });

      // Also invalidate dashboard queries that might contain products
      queryClient.invalidateQueries({
        queryKey: ["dashboard"],
        exact: false,
      });
    },

    // Enhanced refresh with comprehensive cache clearing
    refetchProducts: () => {
      // Clear all related caches
      apiService.clearProductsCache();
      apiService.clearFarmersCache();

      // Force refetch ALL products queries
      queryClient.refetchQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false,
      });

      // Also refetch dashboard queries
      queryClient.refetchQueries({
        queryKey: ["dashboard"],
        exact: false,
      });
    },

    // Clear products cache completely
    removeProducts: () => {
      apiService.clearProductsCache();
      // Remove ALL products queries regardless of filter state
      queryClient.removeQueries({
        queryKey: PRODUCTS_QUERY_KEY,
        exact: false,
      });

      // Also remove dashboard queries
      queryClient.removeQueries({
        queryKey: ["dashboard"],
        exact: false,
      });
    },

    // OPTIMISTIC UPDATE: Add new product immediately to cache
    addProductOptimistically: (newProduct) => {
      // Update ALL products queries with better duplicate prevention
      queryClient.setQueriesData(
        { queryKey: PRODUCTS_QUERY_KEY, exact: false },
        (oldData) => {
          if (!oldData?.products) {
            console.log(
              "⚠️ [PRODUCTS CACHE] No existing products data, skipping",
            );
            return oldData;
          }

          // FIXED: Better duplicate detection using multiple identifiers
          const productExists = oldData.products.some((existing) => {
            // Check by ID first (most reliable)
            if (
              newProduct._id &&
              (existing._id === newProduct._id ||
                existing.id === newProduct._id)
            ) {
              return true;
            }

            // Check by temporary ID (for optimistic updates)
            if (
              newProduct.id &&
              newProduct.id.startsWith("temp_") &&
              (existing._id === newProduct.id || existing.id === newProduct.id)
            ) {
              return true;
            }

            // Check by content similarity (name + farmer + similar timestamp)
            if (
              existing.name === newProduct.name &&
              existing.farmerId === newProduct.farmerId
            ) {
              const existingTime = new Date(existing.createdAt).getTime();
              const newTime = new Date(
                newProduct.createdAt || new Date(),
              ).getTime();
              const timeDiff = Math.abs(existingTime - newTime);

              // If created within 10 seconds, likely duplicate
              if (timeDiff < 10000) {
                return true;
              }
            }

            return false;
          });

          if (productExists) {
            return oldData;
          }

          // Add new product at the beginning with proper timestamp
          const productWithTimestamp = {
            ...newProduct,
            createdAt: newProduct.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Ensure it has proper status for display
            status: newProduct.status || "active",
          };

          const updatedProducts = [productWithTimestamp, ...oldData.products];

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
        },
      );
    },

    // OPTIMISTIC UPDATE: Update product in cache immediately
    updateProductOptimistically: (productId, updatedData) => {
      queryClient.setQueriesData(
        { queryKey: PRODUCTS_QUERY_KEY, exact: false },
        (oldData) => {
          if (!oldData?.products) return oldData;

          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product._id === productId || product.id === productId
                ? {
                    ...product,
                    ...updatedData,
                    updatedAt: new Date().toISOString(),
                  }
                : product,
            ),
          };
        },
      );

      // Also update dashboard cache
      queryClient.setQueriesData(
        { queryKey: ["dashboard"], exact: false },
        (oldData) => {
          if (!oldData?.products) return oldData;

          return {
            ...oldData,
            products: oldData.products.map((product) =>
              product._id === productId || product.id === productId
                ? {
                    ...product,
                    ...updatedData,
                    updatedAt: new Date().toISOString(),
                  }
                : product,
            ),
          };
        },
      );
    },

    // OPTIMISTIC UPDATE: Delete product from cache immediately
    deleteProductOptimistically: (productId) => {
      queryClient.setQueriesData(
        { queryKey: PRODUCTS_QUERY_KEY, exact: false },
        (oldData) => {
          if (!oldData?.products) return oldData;

          const filteredProducts = oldData.products.filter(
            (product) => product._id !== productId && product.id !== productId,
          );

          return {
            ...oldData,
            products: filteredProducts,
            pagination: oldData.pagination
              ? {
                  ...oldData.pagination,
                  total: Math.max((oldData.pagination.total || 0) - 1, 0),
                }
              : undefined,
          };
        },
      );

      // Also update dashboard cache
      queryClient.setQueriesData(
        { queryKey: ["dashboard"], exact: false },
        (oldData) => {
          if (!oldData?.products) return oldData;

          return {
            ...oldData,
            products: oldData.products.filter(
              (product) =>
                product._id !== productId && product.id !== productId,
            ),
          };
        },
      );
    },

    // OPTIMISTIC UPDATE: Reorder products for newest filter
    reorderProductsOptimistically: (sortBy = "newest") => {
      queryClient.setQueriesData(
        { queryKey: PRODUCTS_QUERY_KEY, exact: false },
        (oldData) => {
          if (!oldData?.products) return oldData;

          let sortedProducts = [...oldData.products];

          switch (sortBy) {
            case "newest":
              sortedProducts.sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
              );
              break;
            case "oldest":
              sortedProducts.sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
              );
              break;
            case "price-low":
              sortedProducts.sort(
                (a, b) => parseFloat(a.price) - parseFloat(b.price),
              );
              break;
            case "price-high":
              sortedProducts.sort(
                (a, b) => parseFloat(b.price) - parseFloat(a.price),
              );
              break;
            default:
              break;
          }

          return {
            ...oldData,
            products: sortedProducts,
          };
        },
      );
    },
  };
}
