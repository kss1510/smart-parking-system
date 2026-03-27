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

function HistoryCard({ record }: { record: HistoryRecord }) {
  const entryDate = new Date(record.entryTime);
  const exitDate = record.exitTime ? new Date(record.exitTime) : null;
  const completed = !!exitDate;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.vehicleTag}>
          <Feather name="truck" size={13} color={C.tint} />
          <Text style={styles.vehicleNum}>{record.vehicleNumber}</Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: completed ? C.successLight : C.statusReservedLight }]}>
          <View style={[styles.statusDot, { backgroundColor: completed ? C.success : C.statusReserved }]} />
          <Text style={[styles.statusTagText, { color: completed ? C.success : C.statusReserved }]}>
            {completed ? `${record.durationMinutes} min` : "In Progress"}
          </Text>
        </View>
      </View>

      <View style={styles.locationRow}>
        <Feather name="map-pin" size={14} color={C.tint} />
        <Text style={styles.locationText}>Zone {record.zoneName} · Slot {record.slotNumber}</Text>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Entry</Text>
          <Text style={styles.timeDate}>{entryDate.toLocaleDateString([], { month: "short", day: "numeric" })}</Text>
          <Text style={styles.timeTime}>{entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
        {exitDate ? (
          <>
            <View style={styles.timeLine}>
              <View style={styles.timeLineBar} />
              <Feather name="arrow-right" size={14} color={C.border} />
              <View style={styles.timeLineBar} />
            </View>
            <View style={[styles.timeBlock, { alignItems: "flex-end" }]}>
              <Text style={styles.timeLabel}>Exit</Text>
              <Text style={styles.timeDate}>{exitDate.toLocaleDateString([], { month: "short", day: "numeric" })}</Text>
              <Text style={styles.timeTime}>{exitDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
            </View>
          </>
        ) : (
          <View style={[styles.ongoingTag]}>
            <View style={styles.ongoingDot} />
            <Text style={styles.ongoingText}>Session Active</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const { data: history = [], isLoading, refetch } = useQuery({
    queryKey: ["history"],
    queryFn: () => getParkingHistory({ limit: 30 }),
    refetchInterval: 15000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const completed = history.filter(h => h.exitTime).length;

  return (
    <View style={styles.screen}>
      <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
        <Text style={styles.heroTitle}>Parking History</Text>
        <Text style={styles.heroSub}>
          {history.length} sessions · {completed} completed
        </Text>
        <View style={styles.statsStrip}>
          <View style={styles.stripStat}>
            <Text style={styles.stripNum}>{history.length}</Text>
            <Text style={styles.stripLbl}>Total</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripStat}>
            <Text style={styles.stripNum}>{completed}</Text>
            <Text style={styles.stripLbl}>Completed</Text>
          </View>
          <View style={styles.stripDivider} />
          <View style={styles.stripStat}>
            <Text style={styles.stripNum}>{history.length - completed}</Text>
            <Text style={styles.stripLbl}>Active</Text>
          </View>
        </View>
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
          renderItem={({ item }) => <HistoryCard record={item} />}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
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
  screen: { flex: 1, backgroundColor: C.background },
  heroHeader: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.62)",
    marginBottom: 20,
  },
  statsStrip: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingVertical: 14,
  },
  stripStat: { flex: 1, alignItems: "center" },
  stripNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  stripLbl: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.58)",
    marginTop: 2,
  },
  stripDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 4 },
  list: { padding: 16, paddingTop: 14 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  vehicleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.tint + "12",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vehicleNum: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.tint,
    letterSpacing: 0.5,
  },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  cardDivider: { height: 1, backgroundColor: C.borderLight, marginBottom: 12 },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeBlock: { flex: 1 },
  timeLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  timeDate: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  timeTime: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  timeLine: { flexDirection: "row", alignItems: "center", gap: 4, marginHorizontal: 8 },
  timeLineBar: { flex: 1, height: 1, backgroundColor: C.border },
  ongoingTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.tint + "12",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  ongoingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.tint },
  ongoingText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.tint },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyState: { alignItems: "center", paddingVertical: 80, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 19, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 8 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 22 },
});
