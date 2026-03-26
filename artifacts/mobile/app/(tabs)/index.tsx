import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationBanner } from "@/components/NotificationBanner";
import { suggestSlot } from "@workspace/api-client-react";
import type { Zone } from "@workspace/api-client-react";
import { useState } from "react";

const C = Colors.light;

const ZONE_COLORS = [
  { bg: C.zoneALight, accent: C.zoneA },
  { bg: C.zoneBLight, accent: C.zoneB },
  { bg: C.zoneCLight, accent: C.zoneC },
];

function ZoneCard({ zone, index, onPress }: { zone: Zone; index: number; onPress: () => void }) {
  const colors = ZONE_COLORS[index % ZONE_COLORS.length];
  const occupancyRate = zone.totalSlots > 0 ? (zone.occupiedSlots + zone.reservedSlots) / zone.totalSlots : 0;
  const statusColor =
    zone.freeSlots === 0 ? C.statusOccupied :
    zone.freeSlots <= 2 ? C.statusReserved :
    C.statusFree;
  const statusLabel =
    zone.freeSlots === 0 ? "Full" :
    zone.freeSlots <= 2 ? "Limited" : "Available";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.zoneCard, { opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={[styles.zoneAccent, { backgroundColor: colors.accent }]} />
      <View style={styles.zoneContent}>
        <View style={styles.zoneTop}>
          <View style={[styles.zoneIcon, { backgroundColor: colors.bg }]}>
            <Text style={[styles.zoneIconText, { color: colors.accent }]}>Zone {zone.name}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{zone.freeSlots}</Text>
            <Text style={styles.statLbl}>Free</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.statusReserved }]}>{zone.reservedSlots}</Text>
            <Text style={styles.statLbl}>Reserved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: C.statusOccupied }]}>{zone.occupiedSlots}</Text>
            <Text style={styles.statLbl}>Occupied</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{zone.totalSlots}</Text>
            <Text style={styles.statLbl}>Total</Text>
          </View>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(occupancyRate * 100, 100)}%` as any, backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(occupancyRate * 100)}% occupied</Text>
      </View>
      <View style={styles.zoneArrow}>
        <Feather name="chevron-right" size={18} color={C.textSecondary} />
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { zones, zonesLoading, refreshZones, activeSession, isOffline, notificationVisible, notificationMessage, showNotification } = useParking();
  const { user } = useAuth();
  const [suggesting, setSuggesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshZones();
    setRefreshing(false);
  };

  const handleSuggest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSuggesting(true);
    try {
      const slot = await suggestSlot();
      showNotification(`AI suggests: Zone ${slot.zoneName} — Slot ${slot.slotNumber}`);
      router.push({ pathname: "/zone/[id]", params: { id: String(slot.zoneId), suggestedSlotId: String(slot.id) } });
    } catch {
      showNotification("No available slots found right now.");
    } finally {
      setSuggesting(false);
    }
  };

  const totalFree = zones.reduce((sum, z) => sum + z.freeSlots, 0);
  const totalSlots = zones.reduce((sum, z) => sum + z.totalSlots, 0);

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <NotificationBanner visible={notificationVisible} message={notificationMessage} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.email?.split("@")[0] ?? "Driver"}</Text>
            <Text style={styles.subtitle}>Campus Parking Overview</Text>
          </View>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Feather name="wifi-off" size={14} color={C.statusOccupied} />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryInner}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalFree}</Text>
              <Text style={styles.summaryLbl}>Available</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalSlots}</Text>
              <Text style={styles.summaryLbl}>Total Slots</Text>
            </View>
            <View style={[styles.summaryDivider]} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{zones.length}</Text>
              <Text style={styles.summaryLbl}>Zones</Text>
            </View>
          </View>
        </View>

        {activeSession && (
          <Pressable
            onPress={() => router.push("/parking/active")}
            style={({ pressed }) => [styles.activeAlert, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.activeAlertIcon}>
              <Feather name="navigation" size={20} color={C.tint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeAlertTitle}>Active Parking</Text>
              <Text style={styles.activeAlertSub}>Vehicle {activeSession.vehicleNumber} · Zone {activeSession.zoneName} · Slot {activeSession.slotNumber}</Text>
            </View>
            <Feather name="chevron-right" size={18} color={C.tint} />
          </Pressable>
        )}

        <Pressable
          onPress={handleSuggest}
          disabled={suggesting}
          style={({ pressed }) => [styles.suggestBtn, { opacity: pressed || suggesting ? 0.85 : 1 }]}
        >
          {suggesting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="zap" size={18} color="#fff" />
          )}
          <Text style={styles.suggestText}>AI Suggest Best Slot</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Parking Zones</Text>

        {zonesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={C.tint} size="large" />
            <Text style={styles.loadingText}>Loading zones...</Text>
          </View>
        ) : zones.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="map" size={40} color={C.textSecondary} />
            <Text style={styles.emptyTitle}>No zones found</Text>
            <Text style={styles.emptyText}>Parking zones will appear here once configured.</Text>
          </View>
        ) : (
          zones.map((zone, index) => (
            <ZoneCard
              key={zone.id}
              zone={zone}
              index={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push({ pathname: "/zone/[id]", params: { id: String(zone.id), name: zone.name } });
              }}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.dangerLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offlineText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.danger },
  summaryCard: {
    backgroundColor: C.tint,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
  },
  summaryInner: {
    flexDirection: "row",
    padding: 20,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  summaryLbl: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },
  activeAlert: {
    backgroundColor: C.infoLight,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.info + "40",
  },
  activeAlertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  activeAlertTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.info,
  },
  activeAlertSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  suggestBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    marginBottom: 24,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  zoneCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  zoneAccent: { width: 4 },
  zoneContent: { flex: 1, padding: 16 },
  zoneTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  zoneIcon: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  zoneIconText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 0 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: C.border },
  progressBarBg: { height: 4, backgroundColor: C.borderLight, borderRadius: 2, marginBottom: 4 },
  progressBarFill: { height: 4, borderRadius: 2 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  zoneArrow: { justifyContent: "center", paddingRight: 12 },
});
