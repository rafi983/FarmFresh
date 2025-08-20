function getAllProductQueries(queryClient) {
  return queryClient
    .getQueryCache()
    .findAll({ queryKey: ["products"], exact: false });
}

export function updateProductAcrossCaches(
  queryClient,
  productId,
  updatedData,
  dashboardKeyParts = [],
) {
  if (!queryClient) return;

  // Update dashboard (single composite query shape)
  if (dashboardKeyParts.length) {
    queryClient.setQueryData(dashboardKeyParts, (oldData) => {
      if (!oldData?.products) return oldData;
      return {
        ...oldData,
        products: oldData.products.map((p) =>
          p._id === productId || p.id === productId
            ? { ...p, ...updatedData }
            : p,
        ),
      };
    });
  }

  // Update all products queries
  const allProducts = getAllProductQueries(queryClient);
  allProducts.forEach((q) => {
    queryClient.setQueryData(q.queryKey, (oldData) => {
      if (!oldData?.products) return oldData;
      return {
        ...oldData,
        products: oldData.products.map((p) =>
          p._id === productId || p.id === productId
            ? { ...p, ...updatedData }
            : p,
        ),
      };
    });
  });
}

export function bulkUpdateProductsAcrossCaches(
  queryClient,
  productIds = [],
  updateData = {},
  dashboardKeyParts = [],
) {
  if (!queryClient || !productIds.length) return;

  // Dashboard
  if (dashboardKeyParts.length) {
    queryClient.setQueryData(dashboardKeyParts, (oldData) => {
      if (!oldData?.products) return oldData;
      return {
        ...oldData,
        products: oldData.products
          .map((p) =>
            productIds.includes(p._id || p.id) ? { ...p, ...updateData } : p,
          )
          .filter(Boolean),
      };
    });
  }

  // Products queries
  const allProducts = getAllProductQueries(queryClient);
  allProducts.forEach((q) => {
    queryClient.setQueryData(q.queryKey, (oldData) => {
      if (!oldData?.products) return oldData;
      const updated = oldData.products
        .map((p) =>
          productIds.includes(p._id || p.id) ? { ...p, ...updateData } : p,
        )
        .filter(Boolean);
      return {
        ...oldData,
        products: updated,
        pagination: oldData.pagination
          ? {
              ...oldData.pagination,
              total:
                (oldData.pagination.total || updated.length) -
                (oldData.products.length - updated.length),
            }
          : undefined,
      };
    });
  });
}

export function addOptimisticProduct(
  queryClient,
  optimisticProduct,
  dashboardKeyParts = [],
) {
  if (!queryClient || !optimisticProduct) return;

  if (dashboardKeyParts.length) {
    queryClient.setQueryData(dashboardKeyParts, (oldData) => {
      if (!oldData?.products) return oldData;
      const dup = oldData.products.some(
        (p) => p._id === optimisticProduct._id || p.id === optimisticProduct.id,
      );
      if (dup) return oldData;
      return { ...oldData, products: [optimisticProduct, ...oldData.products] };
    });
  }

  const unifiedQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["products", "all"], exact: false });
  unifiedQueries.forEach((q) => {
    queryClient.setQueryData(q.queryKey, (oldData) => {
      if (!oldData?.products) return oldData;
      const dup = oldData.products.some(
        (p) => p._id === optimisticProduct._id || p.id === optimisticProduct.id,
      );
      if (dup) return oldData;
      return {
        ...oldData,
        products: [optimisticProduct, ...oldData.products],
        meta: { ...oldData.meta, total: (oldData.meta?.total || 0) + 1 },
      };
    });
  });
}

export function replaceTempProduct(
  queryClient,
  tempId,
  finalProduct,
  dashboardKeyParts = [],
) {
  if (!queryClient || !tempId || !finalProduct) return;

  if (dashboardKeyParts.length) {
    queryClient.setQueryData(dashboardKeyParts, (oldData) => {
      if (!oldData?.products) return oldData;
      let found = false;
      const updated = oldData.products.map((p) => {
        if (p._id === tempId || p.id === tempId) {
          found = true;
          return finalProduct;
        }
        return p;
      });
      return found
        ? { ...oldData, products: updated }
        : { ...oldData, products: [finalProduct, ...oldData.products] };
    });
  }

  const unifiedQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["products", "all"], exact: false });
  unifiedQueries.forEach((q) => {
    queryClient.setQueryData(q.queryKey, (oldData) => {
      if (!oldData?.products) return oldData;
      let found = false;
      const updated = oldData.products.map((p) => {
        if (p._id === tempId || p.id === tempId) {
          found = true;
          return finalProduct;
        }
        return p;
      });
      return found
        ? { ...oldData, products: updated }
        : { ...oldData, products: [finalProduct, ...oldData.products] };
    });
  });
}

export function removeProductAcrossCaches(
  queryClient,
  productId,
  dashboardKeyParts = [],
) {
  if (!queryClient || !productId) return;

  if (dashboardKeyParts.length) {
    queryClient.setQueryData(dashboardKeyParts, (oldData) => {
      if (!oldData?.products) return oldData;
      const filtered = oldData.products.filter(
        (p) => p._id !== productId && p.id !== productId,
      );
      return {
        ...oldData,
        products: filtered,
        meta: {
          ...oldData.meta,
          total: Math.max((oldData.meta?.total || 1) - 1, 0),
        },
      };
    });
  }

  const unifiedQueries = queryClient
    .getQueryCache()
    .findAll({ queryKey: ["products", "all"], exact: false });
  unifiedQueries.forEach((q) => {
    queryClient.setQueryData(q.queryKey, (oldData) => {
      if (!oldData?.products) return oldData;
      const filtered = oldData.products.filter(
        (p) => p._id !== productId && p.id !== productId,
      );
      return {
        ...oldData,
        products: filtered,
        meta: {
          ...oldData.meta,
          total: Math.max((oldData.meta?.total || 1) - 1, 0),
        },
      };
    });
  });
}

export function invalidateProductsAndDashboard(queryClient) {
  if (!queryClient) return;
  queryClient.invalidateQueries({
    queryKey: ["dashboard"],
    exact: false,
    refetchType: "none",
  });
  queryClient.invalidateQueries({
    queryKey: ["products"],
    exact: false,
    refetchType: "none",
  });
}
