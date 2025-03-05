import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "../models/user";
import { getCookie } from "../utils/cookies";
import {
  isAuthenticated,
  clearAuth,
  saveAuthToken,
} from "../utils/auth";

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      setLoading(true);

      const token = getCookie("token");
      const authenticated = isAuthenticated();

      if (authenticated && token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          setAccessLevel(decoded.access_level);
          setUserId(decoded.user_id);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Invalid token:", error);
          setIsLoggedIn(false);
          setAccessLevel(null);
          setUserId(null);
          clearAuth();
        }
      } else {
        setIsLoggedIn(false);
        setAccessLevel(null);
        setUserId(null);
      }

      setLoading(false);
    };

    checkAuth();

    // Listen for storage events (if token is updated in another tab)
    window.addEventListener("storage", checkAuth);
    return () => window.removeEventListener("storage", checkAuth);
  }, []);

  const login = (token: string) => {
    saveAuthToken(token);
    setIsLoggedIn(true);

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setAccessLevel(decoded.access_level);
      setUserId(decoded.user_id);
    } catch (error) {
      console.error("Invalid token on login:", error);
    }
  };

  const logout = () => {
    clearAuth();
    setIsLoggedIn(false);
    setAccessLevel(null);
    setUserId(null);
  };

  const isAdmin = () => accessLevel === 9;
  const isManager = () => (accessLevel ?? 0) >= 5;
  const isUser = () => (accessLevel ?? 0) >= 1;

  return {
    isLoggedIn,
    accessLevel,
    userId,
    loading,
    login,
    logout,
    isAdmin,
    isManager,
    isUser,
  };
}
