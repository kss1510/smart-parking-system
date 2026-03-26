import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Zone, Slot, ParkingSession } from "@workspace/api-client-react";
import { getZones, getSlotsByZone, getActiveParking } from "@workspace/api-client-react";

interface ParkingContextType {
  zones: Zone[];
  zonesLoading: boolean;
  refreshZones: () => Promise<void>;
  activeSession: ParkingSession | null;
  refreshActiveSession: (vehicleNumber?: string) => Promise<void>;
  selectedVehicle: string;
  setSelectedVehicle: (v: string) => void;
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
  const [isOffline, setIsOffline] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const notifTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const data = await getActiveParking({ vehicleNumber });
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
