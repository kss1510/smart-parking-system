import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { login, register } from "@workspace/api-client-react";
import { customFetch } from "@workspace/api-client-react";

interface AuthUser {
  token: string;
  userId: number;
  email: string;
  isAdmin: boolean;
  isFaculty?: boolean;
  name?: string | null;
  registrationId?: string | null;
  vehicleNumber?: string | null;
  points?: number;
  violationCount?: number;
  isBlockedUntil?: string | null;
}

interface SignUpOptions {
  name?: string;
  registrationId?: string;
  vehicleNumber?: string;
  adminCode?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, opts?: SignUpOptions) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
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

  const persistUser = async (authUser: AuthUser) => {
    await AsyncStorage.setItem("auth_user", JSON.stringify(authUser));
    setUser(authUser);
  };

  const signIn = async (email: string, password: string) => {
    const data = await login({ email, password });
    await persistUser({
      token: data.token,
      userId: data.userId,
      email: data.email,
      isAdmin: data.isAdmin,
      isFaculty: (data as any).isFaculty,
      name: (data as any).name,
      registrationId: (data as any).registrationId,
      vehicleNumber: (data as any).vehicleNumber,
      points: (data as any).points ?? 0,
      violationCount: (data as any).violationCount ?? 0,
      isBlockedUntil: (data as any).isBlockedUntil ?? null,
    });
  };

  const signUp = async (email: string, password: string, opts?: SignUpOptions) => {
    const data = await register({
      email,
      password,
      ...(opts ?? {}),
    } as any);
    await persistUser({
      token: data.token,
      userId: data.userId,
      email: data.email,
      isAdmin: data.isAdmin,
      isFaculty: (data as any).isFaculty,
      name: (data as any).name ?? opts?.name ?? null,
      registrationId: (data as any).registrationId ?? opts?.registrationId ?? null,
      vehicleNumber: (data as any).vehicleNumber ?? opts?.vehicleNumber ?? null,
      points: (data as any).points ?? 0,
      violationCount: (data as any).violationCount ?? 0,
      isBlockedUntil: (data as any).isBlockedUntil ?? null,
    });
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("auth_user");
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user?.userId) return;
    try {
      const data = await customFetch<any>(`/api/auth/profile/${user.userId}`);
      const updated: AuthUser = {
        ...user,
        name: data.name,
        registrationId: data.registrationId,
        vehicleNumber: data.vehicleNumber,
        points: data.points ?? 0,
        violationCount: data.violationCount ?? 0,
        isBlockedUntil: data.isBlockedUntil ?? null,
        isFaculty: data.isFaculty,
        isAdmin: data.isAdmin ?? user.isAdmin,
      };
      await persistUser(updated);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
