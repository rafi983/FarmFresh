"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api-service";

export function useUnifiedProductsData(filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["products", "all", filters],
    queryFn: async () => {
      const productsParams = {
        includeInactive: false,
        limit: 1000,
        ...filters,
      };

      const productsData = await apiService.getProducts(productsParams);

      return {
        products: productsData?.products || [],
        meta: productsData?.meta || {},
        pagination: productsData?.pagination || {},
      };
    },
    staleTime: 30 * 1000, // Keep data fresh for 30 seconds to allow optimistic updates
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false, // Don't refetch when component mounts - use cache
    refetchOnWindowFocus: false, // Don't refetch when window gets focus - use cache
    retry: 3,
    retryDelay: 1000,
  });

  // Function to invalidate and refetch products data
  const refreshProducts = () => {
    // Clear API service cache first
    if (apiService.clearProductsCache) {
      apiService.clearProductsCache();
    }

    return queryClient.invalidateQueries({
      queryKey: ["products", "all"],
      exact: false,
    });
  };

  // Function to manually refetch
  const refetchProducts = () => {
    return refetch();
  };

  // Function to update specific product in cache without full refetch
  const updateProductInCache = (productId, updatedProduct) => {
    queryClient.setQueryData(["products", "all", filters], (oldData) => {
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
    });
  };

  // Function to add product to cache optimistically
  const addProductToCache = (newProduct) => {
    queryClient.setQueryData(["products", "all", filters], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        products: [newProduct, ...oldData.products],
        meta: {
          ...oldData.meta,
          total: (oldData.meta?.total || 0) + 1,
        },
      };
    });
  };

  // Function to remove product from cache optimistically
  const removeProductFromCache = (productId) => {
    queryClient.setQueryData(["products", "all", filters], (oldData) => {
      if (!oldData) return oldData;

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
  };

  return {
    // Data
    products: data?.products || [],
    meta: data?.meta || {},
    pagination: data?.pagination || {},

    // Loading states
    isLoading,
    error,
    isRefetching,

    // Functions
    refetch: refetchProducts,
    refreshProducts,
    updateProductInCache,
    addProductToCache,
    removeProductFromCache,
  };
}
