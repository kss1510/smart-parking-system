import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

interface AnalyticsData {
  summary: { totalSlots: number; freeSlots: number; occupiedSlots: number; reservedSlots: number };
  zoneStats: { zoneName: string; total: number; free: number; occupied: number; reserved: number; usagePct: number }[];
  topUsers: { userId: number; name: string | null; email: string; registrationId: string | null; points: number; violationCount: number }[];
  violators: { userId: number; name: string | null; email: string; registrationId: string | null; points: number; violationCount: number; isBlockedUntil: string | null }[];
  predictiveAlerts: string[];
}

interface LiveVehicle {
  slotId: number;
  slotNumber: string;
  zoneName: string;
  vehicleNumber: string;
  entryTime: string | null;
  userName: string | null;
  registrationId: string | null;
  userEmail: string | null;
}

type Tab = "overview" | "vehicles" | "users";

interface SlotInfo {
  id: number;
  slotNumber: string;
  zoneName: string;
  zoneId: number;
  status: string;
  slotType: string;
  vehicleNumber: string | null;
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { refreshZones, showNotification } = useParking();
  const { signOut } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [allSlots, setAllSlots] = useState<SlotInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const fetchData = useCallback(async () => {
    try {
      const [analyticsData, vehiclesData, slotsData] = await Promise.all([
        customFetch<AnalyticsData>("/api/admin/analytics"),
        customFetch<LiveVehicle[]>("/api/admin/vehicles"),
        customFetch<SlotInfo[]>("/api/admin/all-slots"),
      ]);
      setAnalytics(analyticsData);
      setVehicles(vehiclesData);
      setAllSlots(slotsData);
    } catch (e: any) {
      showNotification("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
    refreshZones();
  };

  const handleForceFreee = async (slotId: number, vehicleNumber: string) => {
    Alert.alert(
      "Force Free Slot",
      `Release slot for ${vehicleNumber}? This applies a violation penalty.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Force Free",
          style: "destructive",
          onPress: async () => {
            try {
              await customFetch(`/api/admin/force-free/${slotId}`, { method: "POST" });
              showNotification(`Slot force-freed. Penalty applied.`);
              fetchData();
              refreshZones();
            } catch (e: any) {
              showNotification(e?.message ?? "Failed to force free slot");
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = async (userId: number, name: string | null) => {
    Alert.alert("Block User", `Block ${name ?? "this user"} for 1 day?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block",
        style: "destructive",
        onPress: async () => {
          try {
            await customFetch(`/api/admin/block-user/${userId}`, { method: "POST" });
            showNotification("User blocked for 1 day.");
            fetchData();
          } catch { showNotification("Failed to block user"); }
        },
      },
    ]);
  };

  const handleUnblock = async (userId: number) => {
    try {
      await customFetch(`/api/admin/unblock-user/${userId}`, { method: "POST" });
      showNotification("User unblocked.");
      fetchData();
    } catch { showNotification("Failed to unblock"); }
  };

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = !search.trim() || (
      v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.registrationId ?? "").toLowerCase().includes(search.toLowerCase())
    );
    const matchesZone = !zoneFilter || v.zoneName === zoneFilter;
    return matchesSearch && matchesZone;
  });

  const zones = [...new Set(vehicles.map(v => v.zoneName))];

  const getElapsed = (entryTime: string | null) => {
    if (!entryTime) return "—";
    const ms = Date.now() - new Date(entryTime).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.push("/admin/scanner")} style={styles.backBtn}>
          <Feather name="camera" size={18} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSub}>Live monitoring & analytics</Text>
        </View>
        <Pressable onPress={onRefresh} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={17} color="rgba(255,255,255,0.7)" />
        </Pressable>
        <Pressable onPress={signOut} style={[styles.refreshBtn, { marginLeft: 6 }]}>
          <Feather name="log-out" size={17} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {(["overview", "vehicles", "users"] as Tab[]).map(tab => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "overview" ? "Overview" : tab === "vehicles" ? `Live (${vehicles.length})` : "Users"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.tint} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "overview" && analytics && (
            <>
              {analytics.predictiveAlerts.length > 0 && (
                <View style={styles.alertBanner}>
                  <Feather name="alert-triangle" size={16} color="#92400E" />
                  {analytics.predictiveAlerts.map((alert, i) => (
                    <Text key={i} style={styles.alertText}>{alert}</Text>
                  ))}
                </View>
              )}

              <Text style={styles.sectionLabel}>Summary</Text>
              <View style={styles.summaryGrid}>
                <SummaryCard label="Total" value={analytics.summary.totalSlots} color={C.tint} icon="grid" />
                <SummaryCard label="Free" value={analytics.summary.freeSlots} color={C.statusFree} icon="check-circle" />
                <SummaryCard label="Occupied" value={analytics.summary.occupiedSlots} color={C.statusOccupied} icon="car" />
                <SummaryCard label="Reserved" value={analytics.summary.reservedSlots} color={C.statusReserved} icon="clock" />
              </View>

              <Text style={styles.sectionLabel}>Zone Usage</Text>
              {analytics.zoneStats.map(zone => (
                <View key={zone.zoneName} style={styles.zoneBar}>
                  <View style={styles.zoneBarHeader}>
                    <Text style={styles.zoneBarLabel}>Zone {zone.zoneName}</Text>
                    <Text style={styles.zoneBarPct}>{zone.usagePct}%</Text>
                  </View>
                  <View style={styles.zoneBarTrack}>
                    <View style={[styles.zoneBarFill, {
                      width: `${zone.usagePct}%`,
                      backgroundColor: zone.usagePct >= 80 ? C.statusOccupied : zone.usagePct >= 50 ? C.statusReserved : C.statusFree,
                    }]} />
                  </View>
                  <View style={styles.zoneBarStats}>
                    <Text style={styles.zoneBarStat}>{zone.free} free</Text>
                    <Text style={styles.zoneBarStat}>{zone.occupied} occupied</Text>
                    <Text style={styles.zoneBarStat}>{zone.reserved} reserved</Text>
                  </View>
                </View>
              ))}

              <Text style={styles.sectionLabel}>Slot Heatmap</Text>
              <View style={styles.heatmapGrid}>
                {allSlots.length > 0
                  ? allSlots.map(slot => {
                      let color = C.statusFree;
                      if (slot.slotType === "FACULTY") color = "#8B5CF6";
                      else if (slot.status === "OCCUPIED") color = C.statusOccupied;
                      else if (slot.status === "RESERVED") color = C.statusReserved;
                      const textColor = (slot.status === "FREE" && slot.slotType !== "FACULTY") ? "#166534" : "#fff";
                      return (
                        <View key={slot.id} style={[styles.heatCell, { backgroundColor: color }]}>
                          <Text style={[styles.heatCellText, { color: textColor }]}>{slot.slotNumber}</Text>
                        </View>
                      );
                    })
                  : analytics.zoneStats.flatMap(zone =>
                      Array.from({ length: zone.total }, (_, i) => {
                        const ratio = zone.total > 0 ? (zone.occupied + zone.reserved) / zone.total : 0;
                        const color = ratio >= 0.8 ? C.statusOccupied : ratio >= 0.5 ? C.statusReserved : C.statusFree;
                        return (
                          <View key={`${zone.zoneName}-${i}`} style={[styles.heatCell, { backgroundColor: color }]}>
                            <Text style={styles.heatCellText}>{zone.zoneName}{i + 1}</Text>
                          </View>
                        );
                      })
                    )
                }
              </View>

              <View style={styles.legendRow}>
                {[
                  { color: C.statusFree, label: "Free" },
                  { color: C.statusReserved, label: "Reserved" },
                  { color: C.statusOccupied, label: "Occupied" },
                  { color: "#8B5CF6", label: "Faculty" },
                ].map(l => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={styles.legendLabel}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {activeTab === "vehicles" && (
            <>
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={16} color={C.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search vehicle, name, reg ID..."
                    placeholderTextColor={C.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                  />
                  {search.length > 0 && (
                    <Pressable onPress={() => setSearch("")}>
                      <Feather name="x" size={16} color={C.textSecondary} />
                    </Pressable>
                  )}
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <Pressable
                  onPress={() => setZoneFilter(null)}
                  style={[styles.filterChip, !zoneFilter && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, !zoneFilter && styles.filterChipTextActive]}>All Zones</Text>
                </Pressable>
                {zones.map(z => (
                  <Pressable
                    key={z}
                    onPress={() => setZoneFilter(zoneFilter === z ? null : z)}
                    style={[styles.filterChip, zoneFilter === z && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, zoneFilter === z && styles.filterChipTextActive]}>Zone {z}</Text>
                  </Pressable>
                ))}
              </ScrollView>

              {filteredVehicles.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Feather name="car" size={36} color={C.textSecondary} />
                  <Text style={styles.emptyTitle}>No Active Vehicles</Text>
                  <Text style={styles.emptySub}>All parking slots are currently free</Text>
                </View>
              ) : (
                filteredVehicles.map(v => (
                  <View key={v.slotId} style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleZoneBadge}>
                        <Text style={styles.vehicleZoneText}>Zone {v.zoneName}</Text>
                      </View>
                      <Text style={styles.vehicleSlot}>{v.slotNumber}</Text>
                      <View style={styles.vehicleElapsed}>
                        <Feather name="clock" size={11} color={C.textSecondary} />
                        <Text style={styles.vehicleElapsedText}>{getElapsed(v.entryTime)}</Text>
                      </View>
                    </View>
                    <Text style={styles.vehicleNum}>{v.vehicleNumber}</Text>
                    <View style={styles.vehicleDetails}>
                      {v.userName && (
                        <View style={styles.vehicleDetailRow}>
                          <Feather name="user" size={13} color={C.textSecondary} />
                          <Text style={styles.vehicleDetailText}>{v.userName}</Text>
                        </View>
                      )}
                      {v.registrationId && (
                        <View style={styles.vehicleDetailRow}>
                          <Feather name="credit-card" size={13} color={C.textSecondary} />
                          <Text style={styles.vehicleDetailText}>{v.registrationId}</Text>
                        </View>
                      )}
                      {v.entryTime && (
                        <View style={styles.vehicleDetailRow}>
                          <Feather name="log-in" size={13} color={C.textSecondary} />
                          <Text style={styles.vehicleDetailText}>
                            {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleForceFreee(v.slotId, v.vehicleNumber)}
                      style={styles.forceBtn}
                    >
                      <Feather name="x-circle" size={14} color={C.danger} />
                      <Text style={styles.forceBtnText}>Force Free</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === "users" && analytics && (
            <>
              <Text style={styles.sectionLabel}>Top Earners</Text>
              {analytics.topUsers.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Feather name="star" size={32} color={C.textSecondary} />
                  <Text style={styles.emptyTitle}>No Data Yet</Text>
                </View>
              ) : (
                analytics.topUsers.map((u, i) => (
                  <View key={u.userId} style={styles.userCard}>
                    <View style={[styles.userRank, i < 3 && { backgroundColor: ["#F59E0B", "#9CA3AF", "#CD7C2F"][i] + "20" }]}>
                      <Text style={[styles.userRankText, i < 3 && { color: ["#F59E0B", "#9CA3AF", "#CD7C2F"][i] }]}>
                        #{i + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{u.name ?? u.email}</Text>
                      {u.registrationId && <Text style={styles.userDetail}>{u.registrationId}</Text>}
                    </View>
                    <View style={styles.userPoints}>
                      <Feather name="star" size={12} color="#F59E0B" />
                      <Text style={styles.userPointsText}>{u.points}</Text>
                    </View>
                  </View>
                ))
              )}

              {analytics.violators.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Violations</Text>
                  {analytics.violators.map(v => {
                    const blocked = v.isBlockedUntil && new Date(v.isBlockedUntil) > new Date();
                    return (
                      <View key={v.userId} style={styles.violatorCard}>
                        <View style={styles.violatorInfo}>
                          <Text style={styles.userName}>{v.name ?? v.email}</Text>
                          {v.registrationId && <Text style={styles.userDetail}>{v.registrationId}</Text>}
                          <View style={styles.violatorBadgeRow}>
                            <View style={[styles.violationBadge, { backgroundColor: C.dangerLight }]}>
                              <Text style={[styles.violationBadgeText, { color: C.danger }]}>
                                {v.violationCount} violation{v.violationCount !== 1 ? "s" : ""}
                              </Text>
                            </View>
                            {blocked && (
                              <View style={[styles.violationBadge, { backgroundColor: "#F59E0B20" }]}>
                                <Text style={[styles.violationBadgeText, { color: "#F59E0B" }]}>Blocked</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.violatorActions}>
                          {blocked ? (
                            <Pressable onPress={() => handleUnblock(v.userId)} style={styles.unblockBtn}>
                              <Text style={styles.unblockBtnText}>Unblock</Text>
                            </Pressable>
                          ) : (
                            <Pressable onPress={() => handleBlockUser(v.userId, v.name)} style={styles.blockBtn}>
                              <Text style={styles.blockBtnText}>Block</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SummaryCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={[styles.summaryIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon as any} size={16} color={color} />
      </View>
      <Text style={styles.summaryVal}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 18, backgroundColor: C.tint,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  tabs: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: C.surface, borderRadius: 12, padding: 4, gap: 4,
    borderWidth: 1, borderColor: C.border,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
  },
  tabActive: { backgroundColor: C.tint },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  tabTextActive: { color: "#fff" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  content: { paddingHorizontal: 20, paddingTop: 12 },
  alertBanner: {
    backgroundColor: "#FEF3C7", borderRadius: 14, padding: 14,
    marginBottom: 16, gap: 4,
    borderLeftWidth: 4, borderLeftColor: "#F59E0B",
  },
  alertText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#92400E" },
  sectionLabel: {
    fontSize: 13, fontFamily: "Inter_700Bold", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  summaryCard: {
    width: "47%", backgroundColor: C.surface, borderRadius: 14, padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  summaryIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  summaryVal: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.text },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary, marginTop: 2 },
  zoneBar: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  zoneBarHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  zoneBarLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  zoneBarPct: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.tint },
  zoneBarTrack: { height: 10, backgroundColor: C.borderLight, borderRadius: 5, overflow: "hidden", marginBottom: 8 },
  zoneBarFill: { height: "100%", borderRadius: 5 },
  zoneBarStats: { flexDirection: "row", gap: 12 },
  zoneBarStat: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  heatCell: {
    width: 44, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  heatCellText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  legendRow: { flexDirection: "row", gap: 14, marginBottom: 20, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  searchRow: { marginBottom: 10 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", color: C.text },
  filterScroll: { marginBottom: 12 },
  filterChip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, marginRight: 8,
  },
  filterChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
  emptyBox: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  vehicleCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  vehicleHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  vehicleZoneBadge: { backgroundColor: C.tint + "15", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  vehicleZoneText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.tint },
  vehicleSlot: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, flex: 1 },
  vehicleElapsed: { flexDirection: "row", alignItems: "center", gap: 4 },
  vehicleElapsedText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary },
  vehicleNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 10, letterSpacing: 1 },
  vehicleDetails: { gap: 6, marginBottom: 12 },
  vehicleDetailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  vehicleDetailText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  forceBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    borderWidth: 1, borderColor: C.danger + "50", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  forceBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.danger },
  userCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  userRank: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight,
    alignItems: "center", justifyContent: "center",
  },
  userRankText: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.textSecondary },
  userName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  userDetail: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  userPoints: { flexDirection: "row", alignItems: "center", gap: 4 },
  userPointsText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#F59E0B" },
  violatorCard: {
    backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderLeftWidth: 3, borderLeftColor: C.danger,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  violatorInfo: { flex: 1, gap: 4 },
  violatorBadgeRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  violationBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  violationBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  violatorActions: { gap: 6 },
  blockBtn: {
    backgroundColor: C.dangerLight, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  blockBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.danger },
  unblockBtn: {
    backgroundColor: C.statusFree + "20", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  unblockBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.statusFree },
});
