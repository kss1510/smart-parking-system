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
import { getSlotsByZone } from "@workspace/api-client-react";
import type { Slot } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;
const NUM_COLS = 3;

function SlotCard({
  slot,
  isSuggested,
  onPress,
  onLongPress,
  isAdmin,
}: {
  slot: Slot;
  isSuggested: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  isAdmin: boolean;
}) {
  const [countdown, setCountdown] = useState<number | null>(null);

  const isFacultyLocked = slot.slotType === "FACULTY";

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

  const bgColor = isFacultyLocked && slot.status === "FREE"
    ? "#F0E6FF"
    : slot.status === "FREE"
    ? isSuggested ? C.infoLight : C.statusFreeLight
    : slot.status === "RESERVED"
    ? C.statusReservedLight
    : C.statusOccupiedLight;

  const borderColor = isFacultyLocked && slot.status === "FREE"
    ? "#8B5CF6"
    : isSuggested
    ? C.info
    : slot.status === "FREE"
    ? C.statusFree
    : slot.status === "RESERVED"
    ? C.statusReserved
    : C.statusOccupied;

  const textColor = isFacultyLocked && slot.status === "FREE"
    ? "#8B5CF6"
    : slot.status === "FREE"
    ? isSuggested ? C.info : C.statusFree
    : slot.status === "RESERVED"
    ? C.statusReserved
    : C.statusOccupied;

  const iconName =
    isFacultyLocked && slot.status === "FREE"
      ? "lock"
      : slot.status === "FREE"
      ? "check-circle"
      : slot.status === "RESERVED"
      ? "clock"
      : "x-circle";

  const isDisabled = slot.status === "OCCUPIED" || (isFacultyLocked && !isAdmin);

  return (
    <Pressable
      onPress={isDisabled ? undefined : onPress}
      onLongPress={isAdmin && slot.status !== "FREE" ? onLongPress : undefined}
      style={({ pressed }) => [
        styles.slotCard,
        { backgroundColor: bgColor, borderColor, opacity: pressed ? 0.85 : 1 },
        isDisabled && styles.slotDisabled,
        isSuggested && styles.slotSuggested,
      ]}
    >
      {isSuggested && (
        <View style={styles.aiLabel}>
          <Feather name="zap" size={8} color={C.info} />
        </View>
      )}
      {isFacultyLocked && slot.status === "FREE" && (
        <View style={styles.facultyBadge}>
          <Text style={styles.facultyBadgeText}>FAC</Text>
        </View>
      )}
      <Feather name={iconName as any} size={18} color={textColor} />
      <Text style={[styles.slotNum, { color: textColor }]}>{slot.slotNumber}</Text>
      {isFacultyLocked && slot.status === "FREE" && (
        <Text style={[styles.slotStatus, { color: "#8B5CF6", fontSize: 9 }]}>Faculty</Text>
      )}
      {!isFacultyLocked && slot.status === "FREE" && (
        <Text style={[styles.slotStatus, { color: C.statusFree }]}>Free</Text>
      )}
      {slot.status === "RESERVED" && countdown !== null && (
        <Text style={[styles.slotStatus, { color: C.statusReserved, fontSize: 10 }]}>
          {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
        </Text>
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

  const handleSlotPress = (slot: Slot) => {
    if (slot.status === "OCCUPIED") return;
    if (slot.slotType === "FACULTY" && !user?.isAdmin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Faculty Only",
        "This slot is reserved exclusively for faculty members.",
        [{ text: "OK" }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/parking/confirm",
      params: {
        slotId: String(slot.id),
        slotNumber: slot.slotNumber,
        zoneName: slot.zoneName ?? name ?? "",
        zoneId: String(slot.zoneId ?? id),
      },
    });
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

  const freeCount = slots.filter(s => s.status === "FREE" && s.slotType !== "FACULTY").length;
  const facultyCount = slots.filter(s => s.slotType === "FACULTY").length;
  const reservedCount = slots.filter(s => s.status === "RESERVED").length;
  const occupiedCount = slots.filter(s => s.status === "OCCUPIED").length;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Zone {name ?? id}</Text>
          <Text style={styles.headerSub}>{freeCount} free · {facultyCount} faculty · {occupiedCount} occupied</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        {[
          { color: C.statusFree, label: `${freeCount} Free` },
          { color: C.statusReserved, label: `${reservedCount} Reserved` },
          { color: C.statusOccupied, label: `${occupiedCount} Occupied` },
          { color: "#8B5CF6", label: `${facultyCount} Faculty` },
        ].map(chip => (
          <View key={chip.label} style={styles.statChip}>
            <View style={[styles.chipDot, { backgroundColor: chip.color }]} />
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.tint} />
        </View>
      ) : (
        <FlatList
          data={slots}
          keyExtractor={s => String(s.id)}
          numColumns={NUM_COLS}
          contentContainerStyle={styles.grid}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={C.tint} />}
          renderItem={({ item }) => (
            <SlotCard
              slot={item}
              isSuggested={item.id === suggestedId}
              onPress={() => handleSlotPress(item)}
              onLongPress={() => handleAdminReset(item)}
              isAdmin={!!user?.isAdmin}
            />
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: C.textSecondary, fontFamily: "Inter_400Regular" }}>No slots found.</Text>
            </View>
          }
        />
      )}

      {user?.isAdmin && (
        <View style={styles.adminHint}>
          <Feather name="info" size={12} color={C.textSecondary} />
          <Text style={styles.adminHintText}>Long-press any occupied/reserved slot to force reset</Text>
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
    paddingBottom: 18,
    backgroundColor: C.tint,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 2,
  },
  legendRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statsBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: C.surface,
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.background,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  grid: {
    padding: 12,
    paddingBottom: 80,
  },
  slotCard: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    gap: 4,
    position: "relative",
    minHeight: 80,
  },
  slotDisabled: {
    opacity: 0.6,
  },
  slotSuggested: {
    borderWidth: 2,
  },
  aiLabel: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.infoLight,
    alignItems: "center",
    justifyContent: "center",
  },
  facultyBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#8B5CF6",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  facultyBadgeText: {
    fontSize: 7,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
  slotNum: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  slotStatus: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  adminHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  adminHintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
});
