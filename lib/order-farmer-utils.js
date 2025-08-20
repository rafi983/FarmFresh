export function computeFarmerScopedData(order, farmerEmail) {
  if (!order || !farmerEmail)
    return {
      stableFarmerSubtotal: order?.farmerSubtotal,
      items: order?.items || [],
    };
  const allMatch =
    Array.isArray(order.items) &&
    order.items.every(
      (it) => (it.farmerEmail || it.farmer?.email) === farmerEmail,
    );
  if (allMatch && typeof order.farmerSubtotal === "number") {
    return { stableFarmerSubtotal: order.farmerSubtotal, items: order.items };
  }
  // Else compute.
  let subtotal = 0;
  const filtered = (order.items || []).filter(
    (it) => (it.farmerEmail || it.farmer?.email) === farmerEmail,
  );
  filtered.forEach((it) => {
    const price =
      typeof it.price === "number" ? it.price : parseFloat(it.price) || 0;
    const qty =
      typeof it.quantity === "number"
        ? it.quantity
        : parseFloat(it.quantity) || 0;
    subtotal += price * qty;
  });
  return {
    stableFarmerSubtotal: subtotal,
    items: filtered.length ? filtered : order.items || [],
  };
}

export function mergePreserveMedia(oldItems = [], newItems = []) {
  if (!newItems.length) return oldItems;
  return newItems.map((ni, idx) => {
    const oi = oldItems[idx];
    if (!oi) return ni;
    return {
      ...oi,
      ...ni,
      image: ni.image || oi.image,
      productImage: ni.productImage || oi.productImage,
      images:
        Array.isArray(ni.images) && ni.images.length ? ni.images : oi.images,
    };
  });
}
