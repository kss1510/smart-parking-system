import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { exitParking } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ActiveParkingScreen() {
  const insets = useSafeAreaInsets();
  const { activeSession, refreshZones, refreshActiveSession, showNotification } = useParking();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSession?.entryTime) return;
    const entry = new Date(activeSession.entryTime).getTime();
    const update = () => setElapsedMs(Date.now() - entry);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.entryTime]);

  const handleExit = async () => {
    if (!activeSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Exit Parking",
      `Exit parking for vehicle ${activeSession.vehicleNumber}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit", style: "destructive", onPress: async () => {
            setLoading(true);
            try {
              const result = await exitParking(activeSession.slotId);
              await refreshZones();
              await refreshActiveSession();
              showNotification(`Parked for ${result.duration} min. See you next time!`);
              router.replace("/(tabs)");
            } catch {
              showNotification("Failed to exit. Try again.");
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!activeSession) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Active Parking</Text>
        </View>
        <View style={styles.noSession}>
          <Feather name="map-pin" size={48} color={C.textSecondary} />
          <Text style={styles.noSessionTitle}>No active parking</Text>
          <Text style={styles.noSessionText}>You don't have a vehicle currently parked.</Text>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.goHomeBtn}>
            <Text style={styles.goHomeBtnText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const entryDate = new Date(activeSession.entryTime);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Active Parking</Text>
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
          <Text style={styles.liveDotText}>Live</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.vehicleRow}>
          <View style={styles.vehicleIconWrap}>
            <Feather name="truck" size={28} color={C.tint} />
          </View>
          <Text style={styles.vehicleNum}>{activeSession.vehicleNumber}</Text>
        </View>
        <View style={styles.heroDivider} />
        <View style={styles.heroSlotRow}>
          <View style={styles.heroSlotItem}>
            <Text style={styles.heroSlotLabel}>Zone</Text>
            <Text style={styles.heroSlotValue}>Zone {activeSession.zoneName}</Text>
          </View>
          <View style={styles.heroSlotDivider} />
          <View style={styles.heroSlotItem}>
            <Text style={styles.heroSlotLabel}>Slot</Text>
            <Text style={styles.heroSlotValue}>{activeSession.slotNumber}</Text>
          </View>
        </View>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerLabel}>Parked Duration</Text>
        <Text style={styles.timerValue}>{formatDuration(elapsedMs)}</Text>
        <Text style={styles.timerSince}>
          Since {entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Feather name="calendar" size={16} color={C.textSecondary} />
          <Text style={styles.infoLabel}>Entry Date</Text>
          <Text style={styles.infoValue}>{entryDate.toLocaleDateString()}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="clock" size={16} color={C.textSecondary} />
          <Text style={styles.infoLabel}>Entry Time</Text>
          <Text style={styles.infoValue}>{entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color={C.textSecondary} />
          <Text style={styles.infoLabel}>Location</Text>
          <Text style={styles.infoValue}>Zone {activeSession.zoneName}, Slot {activeSession.slotNumber}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleExit}
        disabled={loading}
        style={({ pressed }) => [styles.exitBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="log-out" size={20} color="#fff" />
            <Text style={styles.exitBtnText}>Exit Parking</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    flex: 1,
  },
  liveDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.statusFreeLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.statusFree,
  },
  liveDotText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.statusFree,
  },
  heroCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 20,
  },
  vehicleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: C.infoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleNum: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: 1,
  },
  heroDivider: { height: 1, backgroundColor: C.borderLight, marginBottom: 20 },
  heroSlotRow: { flexDirection: "row", alignItems: "center" },
  heroSlotItem: { flex: 1, alignItems: "center" },
  heroSlotDivider: { width: 1, height: 40, backgroundColor: C.border },
  heroSlotLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 4 },
  heroSlotValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  timerCard: {
    backgroundColor: C.tint,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  timerValue: {
    fontSize: 44,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 6,
  },
  timerSince: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  exitBtn: {
    backgroundColor: C.statusOccupied,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: C.statusOccupied,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  exitBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  noSession: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  noSessionTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginTop: 8,
  },
  noSessionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  goHomeBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
  },
  goHomeBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
