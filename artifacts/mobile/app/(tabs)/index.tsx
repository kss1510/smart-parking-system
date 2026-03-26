import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Animated,
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

const C = Colors.light;

const ZONE_PALETTES = [
  { bg: "#EFF6FF", accent: "#1A6BFF", light: "#BFDBFE" },
  { bg: "#F0FDF4", accent: "#16A34A", light: "#BBF7D0" },
  { bg: "#FFF7ED", accent: "#EA580C", light: "#FED7AA" },
];

function ZoneCard({ zone, index, onPress }: { zone: Zone; index: number; onPress: () => void }) {
  const palette = ZONE_PALETTES[index % ZONE_PALETTES.length];
  const occupancyRate = zone.totalSlots > 0 ? (zone.occupiedSlots + zone.reservedSlots) / zone.totalSlots : 0;
  const pct = Math.round(occupancyRate * 100);

  const statusColor =
    zone.freeSlots === 0 ? "#EF4444" :
    zone.freeSlots <= 2 ? "#F59E0B" :
    "#22C55E";
  const statusLabel =
    zone.freeSlots === 0 ? "Full" :
    zone.freeSlots <= 2 ? "Limited" : "Available";

  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[styles.zoneCard, { transform: [{ scale }] }]}>
        <View style={[styles.zoneAccentBar, { backgroundColor: palette.accent }]} />
        <View style={styles.zoneBody}>
          <View style={styles.zoneTopRow}>
            <View style={[styles.zoneChip, { backgroundColor: palette.bg, borderColor: palette.light }]}>
              <Text style={[styles.zoneChipText, { color: palette.accent }]}>Zone {zone.name}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusColor + "18" }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={styles.zoneStatsRow}>
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatNum, { color: "#22C55E" }]}>{zone.freeSlots}</Text>
              <Text style={styles.zoneStatLbl}>Free</Text>
            </View>
            <View style={styles.zoneStatDiv} />
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatNum, { color: "#F59E0B" }]}>{zone.reservedSlots}</Text>
              <Text style={styles.zoneStatLbl}>Reserved</Text>
            </View>
            <View style={styles.zoneStatDiv} />
            <View style={styles.zoneStat}>
              <Text style={[styles.zoneStatNum, { color: "#EF4444" }]}>{zone.occupiedSlots}</Text>
              <Text style={styles.zoneStatLbl}>Occupied</Text>
            </View>
            <View style={styles.zoneStatDiv} />
            <View style={styles.zoneStat}>
              <Text style={styles.zoneStatNum}>{zone.totalSlots}</Text>
              <Text style={styles.zoneStatLbl}>Total</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` as any, backgroundColor: statusColor }]} />
          </View>
          <Text style={styles.progressLabel}>{pct}% occupancy</Text>
        </View>
        <View style={styles.zoneArrow}>
          <Feather name="chevron-right" size={16} color={C.textSecondary} />
        </View>
      </Animated.View>
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
  const totalOccupied = zones.reduce((sum, z) => sum + z.occupiedSlots, 0);

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "Driver";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <NotificationBanner visible={notificationVisible} message={notificationMessage} />

      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A6BFF" />}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{displayName}</Text>
              {user?.isAdmin && (
                <View style={styles.adminBadge}>
                  <Feather name="shield" size={10} color="#fff" />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {isOffline && (
              <View style={styles.offlinePill}>
                <Feather name="wifi-off" size={12} color="#EF4444" />
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
            {user?.points !== undefined && (
              <View style={styles.pointsPill}>
                <Feather name="star" size={12} color="#F59E0B" />
                <Text style={styles.pointsText}>{user.points} pts</Text>
              </View>
            )}
          </View>
        </View>

        {user?.isAdmin && (
          <View style={styles.adminRibbon}>
            <View style={styles.adminRibbonLeft}>
              <View style={styles.adminRibbonIcon}>
                <Feather name="shield" size={16} color="#1A6BFF" />
              </View>
              <View>
                <Text style={styles.adminRibbonTitle}>Admin Portal</Text>
                <Text style={styles.adminRibbonSub}>Full system access enabled</Text>
              </View>
            </View>
            <View style={styles.adminRibbonActions}>
              <Pressable
                style={({ pressed }) => [styles.adminRibbonBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/admin/scanner"); }}
              >
                <Feather name="camera" size={14} color="#1A6BFF" />
                <Text style={styles.adminRibbonBtnText}>Scan</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.adminRibbonBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/admin/dashboard"); }}
              >
                <Feather name="bar-chart-2" size={14} color="#1A6BFF" />
                <Text style={styles.adminRibbonBtnText}>Dashboard</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: "#22C55E20" }]}>
              <Feather name="check-circle" size={18} color="#22C55E" />
            </View>
            <Text style={[styles.summaryNum, { color: "#22C55E" }]}>{totalFree}</Text>
            <Text style={styles.summaryLbl}>Available</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: "#EF444420" }]}>
              <Feather name="x-circle" size={18} color="#EF4444" />
            </View>
            <Text style={[styles.summaryNum, { color: "#EF4444" }]}>{totalOccupied}</Text>
            <Text style={styles.summaryLbl}>Occupied</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={[styles.summaryIcon, { backgroundColor: "#1A6BFF20" }]}>
              <Feather name="map-pin" size={18} color="#1A6BFF" />
            </View>
            <Text style={[styles.summaryNum, { color: "#1A6BFF" }]}>{totalSlots}</Text>
            <Text style={styles.summaryLbl}>Total Slots</Text>
          </View>
        </View>

        {activeSession && (
          <Pressable
            onPress={() => router.push("/parking/active")}
            style={({ pressed }) => [styles.activeCard, { opacity: pressed ? 0.93 : 1 }]}
          >
            <View style={styles.activeCardLeft}>
              <View style={styles.activePulse}>
                <View style={styles.activeDot} />
              </View>
              <View>
                <Text style={styles.activeTitle}>Active Parking Session</Text>
                <Text style={styles.activeSub}>
                  {activeSession.vehicleNumber} · Zone {activeSession.zoneName} · Slot {activeSession.slotNumber}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={18} color="#1A6BFF" />
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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Parking Zones</Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.legendText}>Free</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
              <Text style={styles.legendText}>Reserved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
          </View>
        </View>

        {zonesLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#1A6BFF" size="large" />
            <Text style={styles.loadingText}>Loading zones...</Text>
          </View>
        ) : zones.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="map" size={40} color={C.textSecondary} />
            <Text style={styles.emptyTitle}>No zones configured</Text>
            <Text style={styles.emptyText}>Parking zones will appear once the admin sets them up.</Text>
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
  container: { paddingHorizontal: 16 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  userName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#1A6BFF",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adminBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff" },

  headerRight: { alignItems: "flex-end", gap: 6, marginTop: 4 },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offlineText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#EF4444" },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  pointsText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#F59E0B" },

  adminRibbon: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adminRibbonLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  adminRibbonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A6BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  adminRibbonTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1E3A5F" },
  adminRibbonSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4B7EC8" },
  adminRibbonActions: { flexDirection: "row", gap: 8 },
  adminRibbonBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  adminRibbonBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#1A6BFF" },

  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    flexDirection: "row",
    paddingVertical: 18,
    paddingHorizontal: 8,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 6 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  summaryNum: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  summaryLbl: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  summaryDivider: { width: 1, backgroundColor: C.borderLight, alignSelf: "stretch", marginVertical: 8 },

  activeCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  activeCardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  activePulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1A6BFF20",
    alignItems: "center",
    justifyContent: "center",
  },
  activeDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#1A6BFF" },
  activeTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1E3A5F" },
  activeSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4B7EC8", marginTop: 2 },

  suggestBtn: {
    backgroundColor: "#1A6BFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    marginBottom: 24,
    shadowColor: "#1A6BFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  suggestText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  legend: { flexDirection: "row", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary },

  zoneCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  zoneAccentBar: { width: 5 },
  zoneBody: { flex: 1, padding: 14 },
  zoneTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  zoneChip: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
  },
  zoneChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  zoneStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  zoneStat: { flex: 1, alignItems: "center" },
  zoneStatNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  zoneStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  zoneStatDiv: { width: 1, height: 28, backgroundColor: C.borderLight },
  progressTrack: { height: 5, backgroundColor: C.borderLight, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  progressFill: { height: "100%", borderRadius: 3 },
  progressLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  zoneArrow: { justifyContent: "center", paddingRight: 14 },

  loadingBox: { alignItems: "center", paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", paddingHorizontal: 24 },
});
