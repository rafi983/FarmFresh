export function safeInsertOrderIntoCache(oldData, newOrder) {
  if (!newOrder) return oldData;
  // Shape A: object with orders array
  if (oldData && typeof oldData === "object" && !Array.isArray(oldData)) {
    const existing = Array.isArray(oldData.orders) ? oldData.orders : [];
    if (existing.some((o) => (o._id || o.id) === (newOrder._id || newOrder.id)))
      return oldData; // already present
    return { ...oldData, orders: [newOrder, ...existing] };
  }
  // Shape B: array (legacy) -> return new composite object to standardize
  if (Array.isArray(oldData)) {
    if (
      oldData.some((o) => (o._id || o.id) === (newOrder._id || newOrder.id))
    ) {
      return { orders: oldData }; // normalize
    }
    return { orders: [newOrder, ...oldData] };
  }
  // No data yet
  return { orders: [newOrder] };
}

export function appendOrdersListener(queryClient, userId, order) {
  if (!queryClient || !userId || !order) return;
  const key = ["orders", userId];
  queryClient.setQueryData(key, (oldData) =>
    safeInsertOrderIntoCache(oldData, order),
  );
}
