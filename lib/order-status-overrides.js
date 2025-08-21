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

export function recordOrderStatusOverride(orderId, status, farmerEmail) {
  if (!orderId || !status) return;

  // For mixed orders, record both the farmer-specific status and global status
  const key = farmerEmail ? `${orderId}__${farmerEmail}` : orderId;
  const timestamp = Date.now();

  overrides.set(key, { status, ts: timestamp, farmerEmail });

  // Also store in window for immediate access by other hooks
  if (typeof window !== "undefined") {
    if (!window.farmfreshStatusOverrides) {
      window.farmfreshStatusOverrides = {};
    }
    window.farmfreshStatusOverrides[key] = {
      status,
      timestamp,
      farmerEmail,
    };
  }

  // Also keep legacy orderId-only for backward compatibility if no farmerEmail supplied
  if (!farmerEmail) {
    overrides.set(orderId, { status, ts: timestamp });
    if (typeof window !== "undefined") {
      window.farmfreshStatusOverrides[orderId] = { status, timestamp };
    }
  }

  console.log("🔍 [OVERRIDE] Recorded status override:", {
    orderId,
    status,
    farmerEmail,
    key,
    timestamp,
  });

  persistToStorage();
}

export function applyOrderStatusOverrides(orders, farmerEmail) {
  if (!Array.isArray(orders) || overrides.size === 0) return orders;
  const now = Date.now();

  return orders.map((o) => {
    const id = o._id || o.id;
    const compositeKey = farmerEmail ? `${id}__${farmerEmail}` : null;

    // Check for farmer-specific override first
    let ov = compositeKey ? overrides.get(compositeKey) : null;
    // Fallback to global override
    if (!ov) ov = overrides.get(id);

    if (ov && typeof ov.status === "string" && now - ov.ts < MAX_AGE_MS) {
      console.log("🔍 [OVERRIDE] Applying status override:", {
        orderId: id,
        originalStatus: o.status,
        overrideStatus: ov.status,
        farmerEmail: ov.farmerEmail,
        isFarmerSpecific: !!ov.farmerEmail,
      });

      // For farmer-specific overrides on mixed orders, update the farmer status map
      if (ov.farmerEmail && o.status === "mixed" && o.farmerStatuses) {
        return {
          ...o,
          farmerStatuses: {
            ...o.farmerStatuses,
            [ov.farmerEmail]: ov.status,
          },
        };
      }

      // For global status overrides
      return { ...o, status: ov.status };
    }

    return o;
  });
}

export function getOrderStatusOverride(orderId, farmerEmail) {
  return (
    overrides.get(farmerEmail ? `${orderId}__${farmerEmail}` : orderId) ||
    overrides.get(orderId)
  )?.status;
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
