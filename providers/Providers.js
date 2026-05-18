"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { MessagingProvider } from "@/contexts/MessagingContext";
import { OrderUpdateProvider } from "@/contexts/OrderUpdateContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            gcTime: 10 * 60 * 1000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__REACT_QUERY_CLIENT__ = queryClient;
    }
  }, [queryClient]);

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
