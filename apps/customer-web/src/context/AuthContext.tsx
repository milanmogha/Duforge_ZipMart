import React, { createContext, useContext, useState, ReactNode } from "react";
import type { User } from "../api";
import { verifyLoginOtp as apiVerifyLoginOtp } from "../api";
import { toast } from "react-toastify";

interface AuthContextType {
  user: User | null;
  authToken: string | null;
  isAuthenticated: boolean;
  /** Exchange the emailed OTP for a session */
  loginWithOtp: (email: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem("token"));
  const isAuthenticated = Boolean(authToken);

  const loginWithOtp = async (email: string, otp: string) => {
    try {
      const { token, user: loggedInUser } = await apiVerifyLoginOtp(email, otp);
      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(loggedInUser);
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    toast.info("Logged out.");
  };

  return (
    <AuthContext.Provider value={{ user, authToken, isAuthenticated, loginWithOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
