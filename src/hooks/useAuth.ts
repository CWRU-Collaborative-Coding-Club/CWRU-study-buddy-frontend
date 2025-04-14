import { useState, useEffect, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { DecodedToken } from "../models/user";
import { getCookie } from "../utils/cookies";
import {
  isAuthenticated,
  clearAuth,
  saveAuthToken,
} from "../utils/auth";
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [accessLevel, setAccessLevel] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const expirationTimer = useRef<NodeJS.Timeout | null>(null);

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
        
        // Set up expiration timer
        setupExpirationTimer(decoded.exp);
      } catch (error) {
        console.error("Invalid token:", error);
        handleLogout();
      }
    } else {
      handleLogout();
    }

    setLoading(false);
  };
  
  const setupExpirationTimer = (expirationTime: number) => {
    // Clear any existing timer
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
    }
    
    // Calculate time until expiration in milliseconds
    const currentTime = Date.now() / 1000;
    const timeUntilExpiration = (expirationTime - currentTime) * 1000;
    
    // If token is already expired or will expire in less than 0 ms, logout immediately
    if (timeUntilExpiration <= 0) {
      handleLogout();
      return;
    }
    
    // Set timer to logout when token expires
    expirationTimer.current = setTimeout(() => {
      console.log("Token expired, logging out");
      handleLogout();
    }, timeUntilExpiration);
  };
  
  const handleLogout = () => {
    // Clear any active expiration timer
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
    
    clearAuth();
    setIsLoggedIn(false);
    setAccessLevel(null);
    setUserId(null);
    router.push('/auth/signin');
  };

  useEffect(() => {
    checkAuth();
    
    // Listen for storage events (if token is updated in another tab)
    window.addEventListener("storage", checkAuth);
    
    return () => {
      window.removeEventListener("storage", checkAuth);
      // Clear timer on unmount
      if (expirationTimer.current) {
        clearTimeout(expirationTimer.current);
      }
    };
  }, []);

  const login = (token: string) => {
    saveAuthToken(token);
    setIsLoggedIn(true);

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setAccessLevel(decoded.access_level);
      setUserId(decoded.user_id);
      
      // Set up expiration timer when logging in
      setupExpirationTimer(decoded.exp);
    } catch (error) {
      console.error("Invalid token on login:", error);
    }
  };

  const logout = () => {
    handleLogout();
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
