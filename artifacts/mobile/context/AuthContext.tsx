import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { login, register } from "@workspace/api-client-react";

interface AuthUser {
  token: string;
  userId: number;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  toggleAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("auth_user").then((stored) => {
      if (stored) {
        setUser(JSON.parse(stored));
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    const data = await login({ email, password });
    const authUser: AuthUser = {
      token: data.token,
      userId: data.userId,
      email: data.email,
      isAdmin: data.isAdmin,
    };
    await AsyncStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  };

  const signUp = async (email: string, password: string) => {
    const data = await register({ email, password });
    const authUser: AuthUser = {
      token: data.token,
      userId: data.userId,
      email: data.email,
      isAdmin: data.isAdmin,
    };
    await AsyncStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("auth_user");
    setUser(null);
  };

  const toggleAdmin = () => {
    if (!user) return;
    const updated = { ...user, isAdmin: !user.isAdmin };
    setUser(updated);
    AsyncStorage.setItem("auth_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, toggleAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
