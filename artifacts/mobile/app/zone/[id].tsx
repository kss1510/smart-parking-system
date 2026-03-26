import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getSlotsByZone, reserveSlot } from "@workspace/api-client-react";
import type { Slot } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;
const NUM_COLS = 3;

function SlotCard({
  slot,
  isSuggested,
  onPress,
}: {
  slot: Slot;
  isSuggested: boolean;
  onPress: () => void;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (slot.status === "RESERVED" && slot.reservedUntil) {
      const end = new Date(slot.reservedUntil).getTime();
      const update = () => {
        const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        setCountdown(remaining);
      };
      update();
      const timer = setInterval(update, 500);
      return () => clearInterval(timer);
    } else {
      setCountdown(null);
    }
  }, [slot.status, slot.reservedUntil]);

  const bgColor =
    slot.status === "FREE"
      ? isSuggested ? C.infoLight : C.statusFreeLight
      : slot.status === "RESERVED"
      ? C.statusReservedLight
      : C.statusOccupiedLight;

  const borderColor =
    isSuggested
      ? C.info
      : slot.status === "FREE"
      ? C.statusFree
      : slot.status === "RESERVED"
      ? C.statusReserved
      : C.statusOccupied;

  const textColor =
    slot.status === "FREE"
      ? isSuggested ? C.info : C.statusFree
      : slot.status === "RESERVED"
      ? C.statusReserved
      : C.statusOccupied;

  const iconName: "check-circle" | "clock" | "x-circle" =
    slot.status === "FREE" ? "check-circle" :
    slot.status === "RESERVED" ? "clock" : "x-circle";

  return (
    <Pressable
      onPress={slot.status !== "OCCUPIED" ? onPress : undefined}
      style={({ pressed }) => [
        styles.slotCard,
        { backgroundColor: bgColor, borderColor, opacity: pressed ? 0.85 : 1 },
        slot.status === "OCCUPIED" && styles.slotDisabled,
        isSuggested && styles.slotSuggested,
      ]}
    >
      {isSuggested && (
        <View style={styles.aiLabel}>
          <Feather name="zap" size={8} color={C.info} />
        </View>
      )}
      <Feather name={iconName} size={18} color={textColor} />
      <Text style={[styles.slotNum, { color: textColor }]}>{slot.slotNumber}</Text>
      {slot.status === "FREE" && (
        <Text style={[styles.slotStatus, { color: C.statusFree }]}>Free</Text>
      )}
      {slot.status === "RESERVED" && countdown !== null && (
        <Text style={[styles.slotStatus, { color: C.statusReserved, fontSize: 10 }]}>{countdown}s</Text>
      )}
      {slot.status === "OCCUPIED" && (
        <Text style={[styles.slotStatus, { color: C.statusOccupied }]}>Occupied</Text>
      )}
    </Pressable>
  );
}

export default function ZoneDetailScreen() {
  const { id, name, suggestedSlotId } = useLocalSearchParams<{ id: string; name: string; suggestedSlotId?: string }>();
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones } = useParking();
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reservingId, setReservingId] = useState<number | null>(null);

  const suggestedId = suggestedSlotId ? parseInt(suggestedSlotId, 10) : null;

  const load = useCallback(async () => {
    try {
      const data = await getSlotsByZone(parseInt(id, 10));
      setSlots(data);
    } catch {
      showNotification("Failed to load slots. Check connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSlotPress = async (slot: Slot) => {
    if (slot.status === "OCCUPIED") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (slot.status === "FREE") {
      setReservingId(slot.id);
      try {
        await reserveSlot(slot.id);
        showNotification(`Slot ${slot.slotNumber} reserved for 30 seconds!`);
        await load();
        await refreshZones();
        router.push({
          pathname: "/parking/confirm",
          params: {
            slotId: String(slot.id),
            slotNumber: slot.slotNumber,
            zoneName: slot.zoneName ?? name ?? "",
          },
        });
      } catch (e: any) {
        showNotification(e?.message ?? "Could not reserve slot.");
      } finally {
        setReservingId(null);
      }
    } else if (slot.status === "RESERVED") {
      router.push({
        pathname: "/parking/confirm",
        params: {
          slotId: String(slot.id),
          slotNumber: slot.slotNumber,
          zoneName: slot.zoneName ?? name ?? "",
        },
      });
    }
  };

  const handleAdminReset = async (slot: Slot) => {
    if (!user?.isAdmin) return;
    Alert.alert("Reset Slot", `Reset slot ${slot.slotNumber} to FREE?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset", style: "destructive", onPress: async () => {
          try {
            const { resetSlot } = await import("@workspace/api-client-react");
            await resetSlot(slot.id);
            showNotification(`Slot ${slot.slotNumber} reset to FREE`);
            load();
            refreshZones();
          } catch {
            showNotification("Failed to reset slot.");
          }
        }
      },
    ]);
  };

  const freeCount = slots.filter(s => s.status === "FREE").length;
  const reservedCount = slots.filter(s => s.status === "RESERVED").length;
  const occupiedCount = slots.filter(s => s.status === "OCCUPIED").length;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Zone {name ?? id}</Text>
          <Text style={styles.headerSub}>{freeCount} slots available</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: C.statusFree }]} />
          <View style={[styles.legendDot, { backgroundColor: C.statusReserved }]} />
          <View style={[styles.legendDot, { backgroundColor: C.statusOccupied }]} />
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statChip}>
          <View style={[styles.chipDot, { backgroundColor: C.statusFree }]} />
          <Text style={styles.chipText}>{freeCount} Free</Text>
        </View>
        <View style={styles.statChip}>
          <View style={[styles.chipDot, { backgroundColor: C.statusReserved }]} />
          <Text style={styles.chipText}>{reservedCount} Reserved</Text>
        </View>
        <View style={styles.statChip}>
          <View style={[styles.chipDot, { backgroundColor: C.statusOccupied }]} />
          <Text style={styles.chipText}>{occupiedCount} Occupied</Text>
        </View>
      </View>

      {suggestedId && (
        <View style={styles.aiHint}>
          <Feather name="zap" size={14} color={C.info} />
          <Text style={styles.aiHintText}>AI suggested slot highlighted in blue</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={C.tint} size="large" />
          <Text style={styles.loadingText}>Loading slots...</Text>
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={(item) => String(item.id)}
          numColumns={NUM_COLS}
          contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.tint} />}
          renderItem={({ item }) => (
            <SlotCard
              slot={item}
              isSuggested={item.id === suggestedId}
              onPress={() => user?.isAdmin && item.status === "OCCUPIED" ? handleAdminReset(item) : handleSlotPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="grid" size={36} color={C.textSecondary} />
              <Text style={styles.emptyTitle}>No slots in this zone</Text>
            </View>
          }
        />
      )}

      {reservingId !== null && (
        <View style={styles.reservingOverlay}>
          <ActivityIndicator color="#fff" size="small" />
          <Text style={styles.reservingText}>Reserving slot...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  headerSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  legendRow: { flexDirection: "row", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  statsBar: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: C.surface,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.text },
  aiHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.infoLight,
  },
  aiHintText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.info },
  grid: { padding: 16, gap: 0 },
  slotCard: {
    flex: 1,
    margin: 6,
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 8,
    position: "relative",
  },
  slotDisabled: { opacity: 0.65 },
  slotSuggested: {
    borderWidth: 2,
    shadowColor: Colors.light.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  aiLabel: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.infoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  slotNum: { fontSize: 16, fontFamily: "Inter_700Bold" },
  slotStatus: { fontSize: 11, fontFamily: "Inter_500Medium" },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8, flex: 1 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_500Medium", color: C.textSecondary },
  reservingOverlay: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    backgroundColor: C.text,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  reservingText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#fff" },
});
