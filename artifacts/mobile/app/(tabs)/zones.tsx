import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  RefreshControl, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";
import { NotificationBanner } from "@/components/NotificationBanner";

const C = Colors.light;

interface ZoneSuggestion {
  zoneId: number;
  zoneName: string;
  freeSlots: number;
  totalSlots: number;
  congestionPct: number;
  congestionLevel: "low" | "medium" | "high";
  routeCost: number;
  recommended: boolean;
  priorityBoost: boolean;
}

const CONGESTION_CONFIG = {
  low: { color: C.statusFree, label: "Low Congestion", icon: "check-circle" },
  medium: { color: C.statusReserved, label: "Moderate", icon: "alert-circle" },
  high: { color: C.statusOccupied, label: "High Congestion", icon: "x-circle" },
};

export default function ZonesScreen() {
  const insets = useSafeAreaInsets();
  const { zones, refreshZones } = useParking();
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ZoneSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const fetchSuggestions = useCallback(async () => {
    try {
      const data = await customFetch<ZoneSuggestion[]>(
        `/api/zones/suggest${user?.userId ? `?userId=${user.userId}` : ""}`
      );
      setSuggestions(data);
    } catch {
      const fallback: ZoneSuggestion[] = zones.map((z, i) => {
        const pct = z.totalSlots > 0 ? Math.round(((z.occupiedSlots + z.reservedSlots) / z.totalSlots) * 100) : 0;
        return {
          zoneId: z.id,
          zoneName: z.name,
          freeSlots: z.freeSlots,
          totalSlots: z.totalSlots,
          congestionPct: pct,
          congestionLevel: pct >= 80 ? "high" : pct >= 50 ? "medium" : "low",
          routeCost: 1 + i,
          recommended: i === 0,
          priorityBoost: false,
        };
      });
      setSuggestions(fallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [zones, user?.userId]);

  useEffect(() => { fetchSuggestions(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    refreshZones();
    fetchSuggestions();
  };

  const priorityScore = user ? ((user as any).priorityScore ?? 0) : 0;
  const priorityColor = priorityScore >= 0 ? C.statusFree : priorityScore === -1 ? C.statusReserved : C.statusOccupied;
  const priorityLabel = priorityScore >= 0 ? "Good Standing" : priorityScore === -1 ? "Low Priority" : "Restricted";

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <NotificationBanner />
      <View style={[styles.hero, { paddingTop: topPad + 20 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroTitle}>Zone Map</Text>
            <Text style={styles.heroSub}>Dijkstra-optimised routing</Text>
          </View>
          <Pressable onPress={onRefresh} style={styles.refreshBtn}>
            <Feather name="refresh-cw" size={16} color="rgba(255,255,255,0.75)" />
          </Pressable>
        </View>

        <View style={styles.priorityCard}>
          <View style={styles.priorityLeft}>
            <Text style={styles.priorityLabel}>Your Priority Score</Text>
            <View style={styles.priorityRow}>
              <Text style={[styles.priorityNum, { color: priorityColor }]}>
                {priorityScore >= 0 ? `+${priorityScore}` : `${priorityScore}`}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + "25" }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{priorityLabel}</Text>
              </View>
            </View>
          </View>
          <View style={styles.priorityLegend}>
            <View style={styles.legendMini}><Text style={styles.legendMiniNum}>0</Text><Text style={styles.legendMiniLbl}>Ideal</Text></View>
            <View style={styles.legendMini}><Text style={[styles.legendMiniNum, { color: C.statusOccupied }]}>−1</Text><Text style={styles.legendMiniLbl}>Low</Text></View>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={styles.loadingText}>Computing optimal routes...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Optimal Zone Ranking</Text>
          <Text style={styles.sectionNote}>Ranked by congestion + distance. Your priority score influences allocation.</Text>

          {suggestions.map((zone, i) => {
            const cfg = CONGESTION_CONFIG[zone.congestionLevel];
            return (
              <Pressable
                key={zone.zoneId}
                onPress={() => router.push(`/zone/${zone.zoneId}`)}
                style={({ pressed }) => [styles.zoneCard, { opacity: pressed ? 0.92 : 1 }, zone.recommended && styles.zoneCardBest]}
              >
                {zone.recommended && (
                  <View style={styles.bestBadge}>
                    <Feather name="award" size={11} color={C.gold} />
                    <Text style={styles.bestBadgeText}>
                      {zone.priorityBoost ? "Best for You (Priority Boosted)" : "Recommended"}
                    </Text>
                  </View>
                )}
                <View style={styles.zoneCardTop}>
                  <View style={[styles.rankCircle, { backgroundColor: i === 0 ? C.gold + "20" : C.tint + "10" }]}>
                    <Text style={[styles.rankNum, { color: i === 0 ? C.gold : C.tint }]}>#{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zoneName}>Zone {zone.zoneName}</Text>
                    <Text style={styles.zoneSlots}>{zone.freeSlots} of {zone.totalSlots} slots free</Text>
                  </View>
                  <View style={styles.routeCostBadge}>
                    <Feather name="navigation" size={11} color={C.textSecondary} />
                    <Text style={styles.routeCostText}>Cost: {zone.routeCost.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.congestionRow}>
                  <View style={[styles.congestionBar, { backgroundColor: C.borderLight }]}>
                    <View style={[
                      styles.congestionFill,
                      { width: `${zone.congestionPct}%` as any, backgroundColor: cfg.color }
                    ]} />
                  </View>
                  <Text style={[styles.congestionPct, { color: cfg.color }]}>{zone.congestionPct}%</Text>
                </View>

                <View style={styles.statusRow}>
                  <View style={[styles.congestionChip, { backgroundColor: cfg.color + "18" }]}>
                    <Feather name={cfg.icon as any} size={12} color={cfg.color} />
                    <Text style={[styles.congestionChipText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <View style={styles.freeChip}>
                    <Feather name="map-pin" size={12} color={C.tint} />
                    <Text style={styles.freeChipText}>{zone.freeSlots} free slots</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={C.border} />
                </View>
              </Pressable>
            );
          })}

          <View style={styles.algorithmCard}>
            <View style={styles.algorithmHeader}>
              <Feather name="cpu" size={16} color={C.tint} />
              <Text style={styles.algorithmTitle}>Dijkstra Routing Active</Text>
            </View>
            <Text style={styles.algorithmText}>
              Zones are ranked using Dijkstra's algorithm. Edge weights combine road distance with real-time congestion. Your priority score shifts your optimal zone assignment — users with score 0 (ideal) get best slot access; score −1 users get lower-ranked suggestions.
            </Text>
            <View style={styles.algorithmSteps}>
              {[
                { step: "1", text: "Congestion weight = occupied / total slots" },
                { step: "2", text: "Dijkstra computes min-cost path to each zone" },
                { step: "3", text: "Priority score adjusts final zone ranking" },
              ].map(s => (
                <View key={s.step} style={styles.stepRow}>
                  <View style={styles.stepNum}><Text style={styles.stepNumText}>{s.step}</Text></View>
                  <Text style={styles.stepText}>{s.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: { backgroundColor: C.tint, paddingHorizontal: 20, paddingBottom: 24 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 },
  heroTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  priorityCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 14,
  },
  priorityLeft: { flex: 1 },
  priorityLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.6)", marginBottom: 6 },
  priorityRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  priorityNum: { fontSize: 28, fontFamily: "Inter_700Bold" },
  priorityBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  priorityBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  priorityLegend: { gap: 8, alignItems: "center" },
  legendMini: { alignItems: "center" },
  legendMiniNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
  legendMiniLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  content: { paddingHorizontal: 16, paddingTop: 18 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  sectionNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 14, lineHeight: 18 },
  zoneCard: {
    backgroundColor: C.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  zoneCardBest: { borderColor: C.gold, borderWidth: 2 },
  bestBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  bestBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.gold, textTransform: "uppercase", letterSpacing: 0.5 },
  zoneCardTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  rankCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rankNum: { fontSize: 14, fontFamily: "Inter_700Bold" },
  zoneName: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  zoneSlots: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  routeCostBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.background, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  routeCostText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary },
  congestionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  congestionBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  congestionFill: { height: "100%", borderRadius: 4 },
  congestionPct: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 36, textAlign: "right" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  congestionChip: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  congestionChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  freeChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.tint + "10", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flex: 1 },
  freeChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.tint },
  algorithmCard: { backgroundColor: C.tint + "08", borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: C.tint + "20" },
  algorithmHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  algorithmTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.tint },
  algorithmText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18, marginBottom: 12 },
  algorithmSteps: { gap: 8 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.tint, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  stepText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, flex: 1 },
});
