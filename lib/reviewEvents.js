// Event system for review updates
class ReviewEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  // Subscribe to review updates for a specific product
  subscribe(productId, callback) {
    if (!this.listeners.has(productId)) {
      this.listeners.set(productId, new Set());
    }
    this.listeners.get(productId).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(productId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(productId);
        }
      }
    };
  }

  // Emit review update event for a specific product
  emit(productId, eventType, data) {
    const callbacks = this.listeners.get(productId);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback({ productId, eventType, data, timestamp: Date.now() });
        } catch (error) {
          console.error("Error in review event listener:", error);
        }
      });
    }

    // Also emit to global listeners (for products list updates)
    const globalCallbacks = this.listeners.get("*");
    if (globalCallbacks) {
      globalCallbacks.forEach((callback) => {
        try {
          callback({ productId, eventType, data, timestamp: Date.now() });
        } catch (error) {
          console.error("Error in global review event listener:", error);
        }
      });
    }
  }

  // Subscribe to all review updates (for products list)
  subscribeGlobal(callback) {
    return this.subscribe("*", callback);
  }

  // Clear all listeners
  clear() {
    this.listeners.clear();
  }
}

// Create a singleton instance
const reviewEvents = new ReviewEventEmitter();

// Event types
export const REVIEW_EVENTS = {
  ADDED: "review_added",
  UPDATED: "review_updated",
  DELETED: "review_deleted",
  STATS_CHANGED: "review_stats_changed",
};

export default reviewEvents;
