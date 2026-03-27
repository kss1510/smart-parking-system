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
  { bg: C.zoneALight, accent: C.zoneA, label: "A" },
  { bg: C.zoneBLight, accent: C.zoneB, label: "B" },
  { bg: C.zoneCLight, accent: C.zoneC, label: "C" },
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
      style={({ pressed }) => [styles.zoneCard, { opacity: pressed ? 0.93 : 1 }]}
    >
      <View style={[styles.zoneHeader, { backgroundColor: colors.accent }]}>
        <Text style={styles.zoneHeaderText}>Zone {zone.name}</Text>
        <View style={[styles.statusChip, { backgroundColor: "rgba(255,255,255,0.22)" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusLabel === "Available" ? "#6EFFC4" : statusLabel === "Limited" ? "#FFD86E" : "#FF8080" }]} />
          <Text style={styles.statusChipText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.zoneBody}>
        <View style={styles.statsRow}>
          {[
            { num: zone.freeSlots, lbl: "Free", color: C.statusFree },
            { num: zone.reservedSlots, lbl: "Reserved", color: C.statusReserved },
            { num: zone.occupiedSlots, lbl: "Occupied", color: C.statusOccupied },
            { num: zone.totalSlots, lbl: "Total", color: C.text },
          ].map((s, i, arr) => (
            <React.Fragment key={s.lbl}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
                <Text style={styles.statLbl}>{s.lbl}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${Math.min(occupancyRate * 100, 100)}%` as any, backgroundColor: statusColor }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressLabel}>{Math.round(occupancyRate * 100)}% occupied</Text>
          <Feather name="chevron-right" size={16} color={colors.accent} />
        </View>
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

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

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
  const displayName = user?.name ? user.name.split(" ")[0] : user?.email?.split("@")[0] ?? "Driver";

  return (
    <View style={styles.screen}>
      <NotificationBanner visible={notificationVisible} message={notificationMessage} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hello, {displayName}</Text>
              <Text style={styles.greetingSub}>GITAM Campus Parking</Text>
            </View>
            <View style={styles.headerRight}>
              {isOffline && (
                <View style={styles.offlineBadge}>
                  <Feather name="wifi-off" size={13} color="#FFD86E" />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.summaryStrip}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalFree}</Text>
              <Text style={styles.summaryLbl}>Available</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{totalSlots}</Text>
              <Text style={styles.summaryLbl}>Total Slots</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNum}>{zones.length}</Text>
              <Text style={styles.summaryLbl}>Zones</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryNum, { color: C.gold }]}>{user?.points ?? 0}</Text>
              <Text style={styles.summaryLbl}>My Points</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {activeSession && (
            <Pressable
              onPress={() => router.push("/parking/active")}
              style={({ pressed }) => [styles.activeAlert, { opacity: pressed ? 0.92 : 1 }]}
            >
              <View style={styles.activePulse}>
                <Feather name="navigation" size={18} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeAlertTitle}>Active Parking Session</Text>
                <Text style={styles.activeAlertSub}>
                  {activeSession.vehicleNumber} · Zone {activeSession.zoneName} · Slot {activeSession.slotNumber}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={C.tint} />
            </Pressable>
          )}

          <Pressable
            onPress={handleSuggest}
            disabled={suggesting}
            style={({ pressed }) => [styles.suggestBtn, { opacity: pressed || suggesting ? 0.85 : 1 }]}
          >
            <View style={styles.suggestBtnLeft}>
              {suggesting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Feather name="zap" size={20} color={C.gold} />
              }
            </View>
            <Text style={styles.suggestText}>AI Smart Slot Suggestion</Text>
            <Feather name="arrow-right" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>

          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Parking Zones</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{zones.length} zones</Text>
            </View>
          </View>

          {zonesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={C.tint} size="large" />
              <Text style={styles.loadingText}>Loading zones...</Text>
            </View>
          ) : zones.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="map" size={40} color={C.border} />
              <Text style={styles.emptyTitle}>No zones configured</Text>
              <Text style={styles.emptyText}>Parking zones will appear here once set up.</Text>
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: {},
  heroHeader: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  greetingSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end", gap: 6 },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  offlineText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#FFD86E" },
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 16,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
  },
  summaryLbl: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.58)",
    marginTop: 3,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 6,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  activeAlert: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: C.tint + "30",
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  activePulse: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  activeAlertTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.tint,
  },
  activeAlertSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  suggestBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    marginBottom: 22,
    paddingHorizontal: 16,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestBtnLeft: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  suggestText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  sectionBadge: {
    backgroundColor: C.tint + "15",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
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
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  zoneCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  zoneHeaderText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.2,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  zoneBody: { padding: 16 },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: C.border },
  progressBarBg: { height: 5, backgroundColor: C.borderLight, borderRadius: 3, marginBottom: 8 },
  progressBarFill: { height: 5, borderRadius: 3 },
  progressFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
