// contexts/OrderUpdateContext.js
"use client";

import { createContext, useContext, useCallback, useRef } from "react";

const OrderUpdateContext = createContext();

export function OrderUpdateProvider({ children }) {
  const listenersRef = useRef(new Set());

  // Add a listener for order updates
  const subscribe = useCallback((callback) => {
    console.log("Adding listener to OrderUpdateContext");
    listenersRef.current.add(callback);

    // Return unsubscribe function
    return () => {
      console.log("Removing listener from OrderUpdateContext");
      listenersRef.current.delete(callback);
    };
  }, []);

  // Notify all listeners about order updates
  const notifyOrderUpdate = useCallback((orderData) => {
    console.log(
      `Notifying ${listenersRef.current.size} listeners about order update:`,
      orderData,
    );
    listenersRef.current.forEach((callback) => {
      try {
        callback(orderData);
      } catch (error) {
        console.error("Error in order update listener:", error);
      }
    });
  }, []);

  // Broadcast order status change
  const broadcastOrderStatusChange = useCallback(
    (orderId, newStatus, orderData = null) => {
      const updateData = {
        type: "STATUS_CHANGE",
        orderId,
        newStatus,
        orderData,
        timestamp: new Date().toISOString(),
      };

      console.log("Broadcasting order status change:", updateData);
      notifyOrderUpdate(updateData);
    },
    [notifyOrderUpdate],
  );

  // Broadcast new order
  const broadcastNewOrder = useCallback(
    (orderData) => {
      const updateData = {
        type: "NEW_ORDER",
        orderData,
        timestamp: new Date().toISOString(),
      };

      console.log("Broadcasting new order:", updateData);
      notifyOrderUpdate(updateData);
    },
    [notifyOrderUpdate],
  );

  const value = {
    subscribe,
    broadcastOrderStatusChange,
    broadcastNewOrder,
    notifyOrderUpdate,
  };

  return (
    <OrderUpdateContext.Provider value={value}>
      {children}
    </OrderUpdateContext.Provider>
  );
}

export function useOrderUpdates() {
  const context = useContext(OrderUpdateContext);
  if (!context) {
    throw new Error(
      "useOrderUpdates must be used within an OrderUpdateProvider",
    );
  }
  return context;
}
