import { jwtDecode } from 'jwt-decode';
import { getCookie, setCookie, removeCookie } from './cookies';
import { DecodedToken } from '../models/user';

export function getAccessToken(): string | null {
  return getCookie('token');
}

export function getDecodedToken(): DecodedToken | null {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

export function getUserAccessLevel(): number | null {
  const decoded = getDecodedToken();
  return decoded?.access_level ?? null;
}

export function isAdmin(): boolean {
  const accessLevel = getUserAccessLevel();
  return accessLevel === 9;
}

export function isManager(): boolean {
  const accessLevel = getUserAccessLevel() ?? 0;
  return accessLevel >= 5;
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch {
    return false;
  }
}

export function saveAuthToken(token: string): void {
  setCookie('token', token, 3); // Store for 3 days
}

export function clearAuth(): void {
  removeCookie('token');
}