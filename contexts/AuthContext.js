"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      // Check if we have stored extended user data
      const storedUserData = localStorage.getItem("farmfresh_user");

      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          // Use stored extended data if available, fallback to session data
          setUser(parsedUserData);
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          setUser(session.user);
        }
      } else {
        setUser(session.user);
      }

      setTokens({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    } else {
      // Check for stored tokens
      const storedTokens = localStorage.getItem("farmfresh_tokens");
      if (storedTokens) {
        setTokens(JSON.parse(storedTokens));
      }

      // Clear stored user data if no session
      localStorage.removeItem("farmfresh_user");
    }
    setLoading(false);
  }, [session, status]);

  const refreshTokens = async () => {
    try {
      if (!tokens?.refreshToken) return null;

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens);
        localStorage.setItem("farmfresh_tokens", JSON.stringify(data.tokens));
        return data.tokens;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
    return null;
  };

  const login = (userData, userTokens) => {
    setUser(userData);
    setTokens(userTokens);
    localStorage.setItem("farmfresh_tokens", JSON.stringify(userTokens));
    localStorage.setItem("farmfresh_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem("farmfresh_tokens");
    localStorage.removeItem("farmfresh_user");
  };

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    // Persist updated user data to localStorage
    localStorage.setItem("farmfresh_user", JSON.stringify(updatedUserData));
  };

  const value = {
    user,
    tokens,
    loading,
    login,
    logout,
    updateUser,
    refreshTokens,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
