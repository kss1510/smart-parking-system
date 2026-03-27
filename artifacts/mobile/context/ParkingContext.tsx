import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Zone } from "@workspace/api-client-react";
import { getZones, customFetch } from "@workspace/api-client-react";

interface ParkingSession {
  slotId: number;
  slotNumber: string;
  zoneName: string;
  vehicleNumber: string;
  entryTime: string;
}

interface ParkingContextType {
  zones: Zone[];
  zonesLoading: boolean;
  refreshZones: () => Promise<void>;
  activeSession: ParkingSession | null;
  refreshActiveSession: (vehicleNumber?: string) => Promise<void>;
  selectedVehicle: string;
  setSelectedVehicle: (v: string) => void;
  currentUserId: number | null;
  setCurrentUserId: (id: number | null) => void;
  isOffline: boolean;
  notificationVisible: boolean;
  notificationMessage: string;
  showNotification: (msg: string) => void;
}

const ParkingContext = createContext<ParkingContextType | null>(null);

const CACHE_KEY = "parking_zones_cache";

export function ParkingProvider({ children }: { children: React.ReactNode }) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<ParkingSession | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<number | null>(null);

  useEffect(() => {
    userIdRef.current = currentUserId;
  }, [currentUserId]);

  const showNotification = useCallback((msg: string) => {
    setNotificationMessage(msg);
    setNotificationVisible(true);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => setNotificationVisible(false), 3500);
  }, []);

  const refreshZones = useCallback(async () => {
    try {
      const data = await getZones();
      setZones(data);
      setIsOffline(false);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      setIsOffline(true);
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) setZones(JSON.parse(cached));
    } finally {
      setZonesLoading(false);
    }
  }, []);

  const refreshActiveSession = useCallback(async (vehicleNumber?: string) => {
    try {
      const uid = userIdRef.current;
      let url = "/api/parking/active";
      if (uid) {
        url += `?userId=${uid}`;
      } else if (vehicleNumber) {
        url += `?vehicleNumber=${encodeURIComponent(vehicleNumber)}`;
      }
      const data = await customFetch<{ session: ParkingSession | null }>(url);
      setActiveSession(data.session ?? null);
    } catch {
      setActiveSession(null);
    }
  }, []);

  useEffect(() => {
    refreshZones();
    refreshActiveSession();
    const interval = setInterval(() => {
      refreshZones();
      refreshActiveSession();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshZones, refreshActiveSession]);

  return (
    <ParkingContext.Provider value={{
      zones, zonesLoading, refreshZones,
      activeSession, refreshActiveSession,
      selectedVehicle, setSelectedVehicle,
      currentUserId, setCurrentUserId,
      isOffline, notificationVisible, notificationMessage, showNotification,
    }}>
      {children}
    </ParkingContext.Provider>
  );
}

export function useParking() {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error("useParking must be used within ParkingProvider");
  return ctx;
}
