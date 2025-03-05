// Mock authentication context for the app.
// This context provides the user's name and role.
//

import React, { createContext, useContext } from 'react';

type UserRole = "Admin" | "Manager" | "User";
interface AuthContextProps {
  user: { name: string; role: UserRole } | null;
}

const AuthContext = createContext<AuthContextProps>({ user: null });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For now, simulate an admin user.
  const user = { name: "John Admin", role: "Admin" } as const;

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);