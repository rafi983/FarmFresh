"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { OrderUpdateProvider } from "@/contexts/OrderUpdateContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (replaces cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: false, // Prevent refetch on network reconnect
            retry: 1,
            // Remove refetchOnMount: false globally - let individual queries decide
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <CartProvider>
              <FavoritesProvider>
                <OrderUpdateProvider>
                  <MessagingProvider>
                    <ToastProvider>{children}</ToastProvider>
                  </MessagingProvider>
                </OrderUpdateProvider>
              </FavoritesProvider>
            </CartProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
