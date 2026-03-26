import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getParkingHistory } from "@workspace/api-client-react";
import type { HistoryRecord } from "@workspace/api-client-react";

const C = Colors.light;

function HistoryCard({ record, index }: { record: HistoryRecord; index: number }) {
  const entryDate = new Date(record.entryTime);
  const exitDate = record.exitTime ? new Date(record.exitTime) : null;

  const ZONE_COLORS = [C.zoneA, C.zoneB, C.zoneC];
  const zoneColor = ZONE_COLORS[record.id % ZONE_COLORS.length];

  return (
    <View style={[styles.card, { borderLeftColor: zoneColor }]}>
      <View style={styles.cardTop}>
        <View style={[styles.vehicleTag, { backgroundColor: zoneColor + "15" }]}>
          <Feather name="truck" size={14} color={zoneColor} />
          <Text style={[styles.vehicleTagText, { color: zoneColor }]}>{record.vehicleNumber}</Text>
        </View>
        {record.durationMinutes !== null && record.durationMinutes !== undefined ? (
          <View style={styles.durationTag}>
            <Text style={styles.durationTagText}>{record.durationMinutes} min</Text>
          </View>
        ) : (
          <View style={[styles.durationTag, { backgroundColor: C.statusReservedLight }]}>
            <Text style={[styles.durationTagText, { color: C.statusReserved }]}>In Progress</Text>
          </View>
        )}
      </View>

      <View style={styles.cardMid}>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={14} color={C.textSecondary} />
          <Text style={styles.locationText}>Zone {record.zoneName} · Slot {record.slotNumber}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.timeItem}>
          <Text style={styles.timeLabel}>Entry</Text>
          <Text style={styles.timeValue}>
            {entryDate.toLocaleDateString([], { month: "short", day: "numeric" })} · {entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
        {exitDate && (
          <>
            <Feather name="arrow-right" size={14} color={C.border} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Exit</Text>
              <Text style={styles.timeValue}>
                {exitDate.toLocaleDateString([], { month: "short", day: "numeric" })} · {exitDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const { data: history = [], isLoading, refetch } = useQuery({
    queryKey: ["history"],
    queryFn: () => getParkingHistory({ limit: 20 }),
    refetchInterval: 10000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Text style={styles.headerTitle}>Parking History</Text>
        <Text style={styles.headerSub}>Recent {history.length} records</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator color={C.tint} size="large" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => <HistoryCard record={item} index={index} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!history.length}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="clock" size={48} color={C.border} />
              <Text style={styles.emptyTitle}>No history yet</Text>
              <Text style={styles.emptyText}>Your parking sessions will appear here after you exit a slot.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 10,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vehicleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vehicleTagText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  durationTag: {
    backgroundColor: C.successLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationTagText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.success,
  },
  cardMid: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderLight,
  },
  timeItem: { flex: 1 },
  timeLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 2 },
  timeValue: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
