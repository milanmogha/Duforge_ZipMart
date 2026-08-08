import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  sendPhoneOtp,
  confirmOtp,
  signOutFirebase,
  AuthUser,
} from "@/lib/firebase";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  phone: string | null;
  isAuthenticated: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([
        AsyncStorage.getItem("authToken"),
        AsyncStorage.getItem("user"),
      ]);
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
      setInitializing(false);
    })();
  }, []);

  const sendOtp = async (phoneNumber: string) => {
    setPhone(phoneNumber);
    await sendPhoneOtp(phoneNumber);
  };

  const verifyOtp = async (code: string) => {
    if (!phone) throw new Error("Please request an OTP first.");
    const { token: jwt, user: profile } = await confirmOtp(phone, code);
    await AsyncStorage.multiSet([
      ["authToken", jwt],
      ["user", JSON.stringify(profile)],
    ]);
    setToken(jwt);
    setUser(profile);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(["authToken", "user"]);
    try {
      await signOutFirebase();
    } catch {}
    setToken(null);
    setUser(null);
    setPhone(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        phone,
        initializing,
        isAuthenticated: !!token,
        sendOtp,
        verifyOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
