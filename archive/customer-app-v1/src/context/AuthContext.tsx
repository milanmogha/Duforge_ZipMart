// src/context/AuthContext.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

import { loginUser, loginWithGoogle as loginWithGoogleApi } from "../services/api";

// Complete any pending AuthSession (Expo Go)
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: any;
  authToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1️⃣ Load stored token/user on mount
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("authToken");
        const storedUser = await AsyncStorage.getItem("user");
        if (token) setAuthToken(token);
        if (storedUser) setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error loading auth data:", err);
      }
    })();
  }, []);

  // 2️⃣ Pull only the non‑iOS client IDs from app.json → expo.extra
  const {
    clientId,
    androidClientId,
    webClientId,   // optional, only if you run web
  } = Constants.expoConfig?.extra as {
    clientId: string;
    androidClientId: string;
    webClientId?: string;
  };

  // 3️⃣ Configure Google Id‑token request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
   clientId,     // for Expo Go / web flow
    androidClientId,  // for standalone Android
    webClientId,      // for browser, if ever used
  });

  // 4️⃣ On success, exchange id_token with your backend
  useEffect(() => {
    if (response?.type === "success" && response.params.id_token) {
      (async () => {
        try {
          const { token, user: backendUser } =
            await loginWithGoogleApi(response.params.id_token);

          setAuthToken(token);
          setUser(backendUser);
          await AsyncStorage.setItem("authToken", token);
          await AsyncStorage.setItem("user", JSON.stringify(backendUser));
        } catch (err: any) {
          Alert.alert("Google Login Error", err.message || "Login failed.");
        }
      })();
    }
  }, [response]);

  // 5️⃣ Email/password login
  const login = async (email: string, password: string) => {
    try {
      const { token, user: backendUser } = await loginUser({ email, password });
      setAuthToken(token);
      setUser(backendUser);
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(backendUser));
    } catch (err: any) {
      throw new Error(err.message || "Login failed.");
    }
  };

  // 6️⃣ Kick off Google sign‑in UI
  const googleLogin = async () => {
    if (!request) {
      Alert.alert("Google Login Error", "Unable to initialize sign-in.");
      return;
    }
    // Expo Go → expoClientId ; Standalone APK → androidClientId
    await promptAsync();
  };

  // 7️⃣ Logout
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
      setAuthToken(null);
      setUser(null);
    } catch (err: any) {
      throw new Error(err.message || "Logout failed.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        isAuthenticated: !!user || !!authToken,
        login,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
