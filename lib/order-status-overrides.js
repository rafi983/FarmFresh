const STORAGE_KEY = "orderStatusOverrides_v1";
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes persistence window

const overrides = new Map(); // orderId -> { status, ts }

function loadFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const now = Date.now();
    Object.entries(parsed).forEach(([id, val]) => {
      if (val && typeof val.status === "string" && now - val.ts < MAX_AGE_MS) {
        overrides.set(id, val);
      }
    });
  } catch {}
}

function persistToStorage() {
  if (typeof window === "undefined") return;
  try {
    const obj = {};
    const now = Date.now();
    overrides.forEach((val, key) => {
      if (now - val.ts < MAX_AGE_MS) obj[key] = val;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

loadFromStorage();

export function recordOrderStatusOverride(orderId, status) {
  if (!orderId || !status) return;
  overrides.set(orderId, { status, ts: Date.now() });
  persistToStorage();
}

export function applyOrderStatusOverrides(orders) {
  if (!Array.isArray(orders) || overrides.size === 0) return orders;
  const now = Date.now();
  return orders.map((o) => {
    const id = o._id || o.id;
    const ov = overrides.get(id);
    if (!ov) return o;
    if (now - ov.ts > MAX_AGE_MS) {
      overrides.delete(id);
      return o;
    }
    if (o.status !== ov.status) {
      return { ...o, status: ov.status };
    }
    return o;
  });
}

export function getOrderStatusOverride(orderId) {
  return overrides.get(orderId)?.status;
}

export function clearOrderStatusOverrides() {
  overrides.clear();
  persistToStorage();
}

// Safer merge for farmer-scoped order objects
export function mergeUpdatedOrder(existing, updated, forcedStatus) {
  if (!existing) return updated;
  const existingItems = existing.items || [];
  const updatedItems = updated?.items || [];
  const farmerScoped =
    typeof existing.farmerSubtotal === "number" &&
    existingItems.length > 0 &&
    updatedItems.length > existingItems.length; // indicates updated includes other farmers' items
  return {
    ...existing,
    ...(farmerScoped ? {} : { items: updatedItems }),
    status: forcedStatus || updated.status || existing.status,
    updatedAt: updated.updatedAt || existing.updatedAt,
  };
}
