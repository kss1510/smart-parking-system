import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform, Pressable,
  ActivityIndicator, RefreshControl, TextInput, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

interface AnalyticsData {
  summary: { totalSlots: number; freeSlots: number; occupiedSlots: number; reservedSlots: number };
  zoneStats: { zoneName: string; total: number; free: number; occupied: number; reserved: number; usagePct: number }[];
  topUsers: { userId: number; name: string | null; email: string; registrationId: string | null; points: number; priorityScore: number; violationCount: number }[];
  violators: { userId: number; name: string | null; email: string; registrationId: string | null; points: number; priorityScore: number; violationCount: number; isBlockedUntil: string | null }[];
  predictiveAlerts: string[];
}

interface LiveVehicle {
  slotId: number; slotNumber: string; zoneName: string;
  vehicleNumber: string; entryTime: string | null;
  userName: string | null; registrationId: string | null; userEmail: string | null;
}

type Tab = "overview" | "vehicles" | "users";

interface SlotInfo {
  id: number; slotNumber: string; zoneName: string; zoneId: number;
  status: string; slotType: string; vehicleNumber: string | null;
}

interface MenuRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  rightEl?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
  accent?: string;
}

function MenuRow({ icon, label, subtitle, rightEl, onPress, danger, accent }: MenuRowProps) {
  const iconColor = danger ? C.danger : accent ?? C.tint;
  const iconBg = danger ? C.dangerLight : (accent ? accent + "15" : C.tint + "12");
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon as any} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {rightEl !== undefined ? rightEl : <Feather name="chevron-right" size={17} color={C.border} />}
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { refreshZones, showNotification } = useParking();
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
    } catch {
      showNotification("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchData(); refreshZones(); };

  const handleForceFree = async (slotId: number, vehicleNumber: string) => {
    Alert.alert("Force Free Slot", `Release slot for ${vehicleNumber}? A penalty will be applied to the user.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Force Free", style: "destructive",
        onPress: async () => {
          try {
            await customFetch(`/api/admin/force-free/${slotId}`, { method: "POST" });
            showNotification("Slot force-freed. Penalty applied.");
            fetchData(); refreshZones();
          } catch (e: any) { showNotification(e?.message ?? "Failed"); }
        },
      },
    ]);
  };

  const handleBlockUser = async (userId: number, name: string | null) => {
    Alert.alert("Block User", `Block ${name ?? "this user"} for 1 day?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Block", style: "destructive",
        onPress: async () => {
          try {
            await customFetch(`/api/admin/block-user/${userId}`, { method: "POST" });
            showNotification("User blocked for 1 day.");
            fetchData();
          } catch { showNotification("Failed"); }
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
    const matchSearch = !search.trim() || (
      v.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      (v.userName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.registrationId ?? "").toLowerCase().includes(search.toLowerCase())
    );
    return matchSearch && (!zoneFilter || v.zoneName === zoneFilter);
  });

  const zones = [...new Set(vehicles.map(v => v.zoneName))];

  const getElapsed = (entryTime: string | null) => {
    if (!entryTime) return "—";
    const ms = Date.now() - new Date(entryTime).getTime();
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Feather name="bar-chart-2" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Admin Dashboard</Text>
              <Text style={styles.heroSub}>Live monitoring & analytics</Text>
            </View>
            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Feather name="refresh-cw" size={16} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>

          {analytics && (
            <View style={styles.heroStats}>
              {[
                { num: analytics.summary.totalSlots, lbl: "Total", color: "#fff" },
                { num: analytics.summary.freeSlots, lbl: "Free", color: "#6EFFC4" },
                { num: analytics.summary.occupiedSlots, lbl: "Occupied", color: "#FF8080" },
                { num: analytics.summary.reservedSlots, lbl: "Reserved", color: "#FFD86E" },
              ].map((s, i, arr) => (
                <React.Fragment key={s.lbl}>
                  <View style={styles.heroStat}>
                    <Text style={[styles.heroStatNum, { color: s.color }]}>{s.num}</Text>
                    <Text style={styles.heroStatLbl}>{s.lbl}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.heroStatDivider} />}
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.body}>
          <View style={styles.tabRow}>
            {(["overview", "vehicles", "users"] as Tab[]).map(tab => (
              <Pressable key={tab} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab); }}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}>
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                  {tab === "overview" ? "Overview" : tab === "vehicles" ? `Live (${vehicles.length})` : "Users"}
                </Text>
              </Pressable>
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.tint} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <>
              {activeTab === "overview" && analytics && (
                <>
                  {analytics.predictiveAlerts.length > 0 && (
                    <View style={styles.alertBanner}>
                      <Feather name="alert-triangle" size={15} color="#92400E" />
                      {analytics.predictiveAlerts.map((a, i) => (
                        <Text key={i} style={styles.alertText}>{a}</Text>
                      ))}
                    </View>
                  )}

                  <Text style={styles.sectionLabel}>Zone Congestion</Text>
                  <View style={styles.sectionCard}>
                    {analytics.zoneStats.map((zone, i) => (
                      <React.Fragment key={zone.zoneName}>
                        {i > 0 && <View style={styles.divider} />}
                        <View style={styles.zoneRow}>
                          <View style={[styles.menuIcon, { backgroundColor: C.tint + "12" }]}>
                            <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: C.tint }}>{zone.zoneName}</Text>
                          </View>
                          <View style={{ flex: 1, gap: 6 }}>
                            <View style={styles.zoneLabelRow}>
                              <Text style={styles.menuLabel}>Zone {zone.zoneName}</Text>
                              <Text style={[styles.zonePct, {
                                color: zone.usagePct >= 80 ? C.statusOccupied : zone.usagePct >= 50 ? C.statusReserved : C.statusFree
                              }]}>{zone.usagePct}%</Text>
                            </View>
                            <View style={styles.zoneBarTrack}>
                              <View style={[styles.zoneBarFill, {
                                width: `${zone.usagePct}%` as any,
                                backgroundColor: zone.usagePct >= 80 ? C.statusOccupied : zone.usagePct >= 50 ? C.statusReserved : C.statusFree,
                              }]} />
                            </View>
                            <Text style={styles.menuSub}>{zone.free} free · {zone.occupied} occupied · {zone.reserved} reserved</Text>
                          </View>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Slot Heatmap</Text>
                  <View style={[styles.sectionCard, { padding: 14 }]}>
                    <View style={styles.heatmapGrid}>
                      {allSlots.map(slot => {
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
                      })}
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
                          <Text style={styles.menuSub}>{l.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {activeTab === "vehicles" && (
                <>
                  <View style={[styles.sectionCard, { padding: 14 }]}>
                    <View style={styles.searchBox}>
                      <Feather name="search" size={15} color={C.textSecondary} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder="Search vehicle, name, reg ID..."
                        placeholderTextColor={C.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                      />
                      {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")}>
                          <Feather name="x" size={15} color={C.textSecondary} />
                        </Pressable>
                      )}
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                      <Pressable onPress={() => setZoneFilter(null)} style={[styles.filterChip, !zoneFilter && styles.filterChipActive]}>
                        <Text style={[styles.filterChipText, !zoneFilter && styles.filterChipTextActive]}>All Zones</Text>
                      </Pressable>
                      {zones.map(z => (
                        <Pressable key={z} onPress={() => setZoneFilter(zoneFilter === z ? null : z)}
                          style={[styles.filterChip, zoneFilter === z && styles.filterChipActive]}>
                          <Text style={[styles.filterChipText, zoneFilter === z && styles.filterChipTextActive]}>Zone {z}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {filteredVehicles.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Feather name="car" size={36} color={C.textSecondary} />
                      <Text style={styles.emptyTitle}>No Active Vehicles</Text>
                      <Text style={styles.menuSub}>All parking slots are free</Text>
                    </View>
                  ) : (
                    <View style={styles.sectionCard}>
                      {filteredVehicles.map((v, i) => (
                        <React.Fragment key={v.slotId}>
                          {i > 0 && <View style={styles.divider} />}
                          <View style={styles.vehicleRow}>
                            <View style={{ flex: 1 }}>
                              <View style={styles.vehicleTopRow}>
                                <View style={[styles.zoneBadge]}>
                                  <Text style={styles.zoneBadgeText}>Zone {v.zoneName} · {v.slotNumber}</Text>
                                </View>
                                <View style={styles.elapsedRow}>
                                  <Feather name="clock" size={11} color={C.textSecondary} />
                                  <Text style={styles.menuSub}>{getElapsed(v.entryTime)}</Text>
                                </View>
                              </View>
                              <Text style={styles.vehicleNum}>{v.vehicleNumber}</Text>
                              {v.userName && <Text style={styles.menuSub}>{v.userName}{v.registrationId ? ` · ${v.registrationId}` : ""}</Text>}
                            </View>
                            <Pressable onPress={() => handleForceFree(v.slotId, v.vehicleNumber)} style={styles.forceFreeBtn}>
                              <Feather name="x-circle" size={14} color={C.danger} />
                              <Text style={styles.forceFreeBtnText}>Free</Text>
                            </Pressable>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  )}
                </>
              )}

              {activeTab === "users" && analytics && (
                <>
                  <Text style={styles.sectionLabel}>Priority Queue</Text>
                  {analytics.topUsers.length === 0 ? (
                    <View style={styles.emptyBox}>
                      <Feather name="users" size={32} color={C.textSecondary} />
                      <Text style={styles.emptyTitle}>No Users Yet</Text>
                    </View>
                  ) : (
                    <View style={styles.sectionCard}>
                      {analytics.topUsers.map((u, i) => {
                        const score = u.priorityScore ?? 0;
                        const scoreColor = score >= 0 ? C.statusFree : score === -1 ? C.statusReserved : C.statusOccupied;
                        return (
                          <React.Fragment key={u.userId}>
                            {i > 0 && <View style={styles.divider} />}
                            <View style={styles.menuRow}>
                              <View style={[styles.menuIcon, { backgroundColor: i < 3 ? (["#F59E0B", "#9CA3AF", "#CD7C2F"][i] + "20") : C.tint + "12" }]}>
                                <Text style={[styles.rankText, i < 3 && { color: ["#F59E0B", "#9CA3AF", "#CD7C2F"][i] }]}>#{i + 1}</Text>
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.menuLabel}>{u.name ?? u.email}</Text>
                                {u.registrationId && <Text style={styles.menuSub}>{u.registrationId}</Text>}
                              </View>
                              <View style={[styles.scorePill, { backgroundColor: scoreColor + "18" }]}>
                                <Text style={[styles.scoreText, { color: scoreColor }]}>
                                  {score >= 0 ? `+${score}` : `${score}`}
                                </Text>
                              </View>
                            </View>
                          </React.Fragment>
                        );
                      })}
                    </View>
                  )}

                  {analytics.violators.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Violations</Text>
                      <View style={styles.sectionCard}>
                        {analytics.violators.map((v, i) => {
                          const blocked = v.isBlockedUntil && new Date(v.isBlockedUntil) > new Date();
                          return (
                            <React.Fragment key={v.userId}>
                              {i > 0 && <View style={styles.divider} />}
                              <View style={styles.menuRow}>
                                <View style={[styles.menuIcon, { backgroundColor: C.dangerLight }]}>
                                  <Feather name="alert-triangle" size={16} color={C.danger} />
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.menuLabel}>{v.name ?? v.email}</Text>
                                  <Text style={styles.menuSub}>{v.violationCount} violation{v.violationCount !== 1 ? "s" : ""} · Score: {v.priorityScore ?? 0}</Text>
                                </View>
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
                            </React.Fragment>
                          );
                        })}
                      </View>
                    </>
                  )}
                </>
              )}
            </>
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
    backgroundColor: C.tint, paddingHorizontal: 20, paddingBottom: 24,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.62)", marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroStats: {
    flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", paddingVertical: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.14)", marginVertical: 4 },
  body: { paddingHorizontal: 18, paddingTop: 16 },
  tabRow: {
    flexDirection: "row", backgroundColor: C.surface, borderRadius: 12,
    padding: 4, gap: 4, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center" },
  tabBtnActive: { backgroundColor: C.tint },
  tabBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  tabBtnTextActive: { color: "#fff" },
  loadingBox: { alignItems: "center", padding: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  alertBanner: {
    backgroundColor: "#FEF3C7", borderRadius: 12, padding: 12, marginBottom: 14,
    gap: 4, borderLeftWidth: 3, borderLeftColor: "#F59E0B",
  },
  alertText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#92400E" },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold", color: C.textSecondary,
    letterSpacing: 0.8, textTransform: "uppercase",
    marginBottom: 8, marginLeft: 4, marginTop: 4,
  },
  sectionCard: {
    backgroundColor: C.surface, borderRadius: 16, overflow: "hidden",
    marginBottom: 18, borderWidth: 1, borderColor: C.border,
    shadowColor: "#004D36", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  zoneRow: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 12 },
  zoneLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  zonePct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  zoneBarTrack: { height: 8, backgroundColor: C.borderLight, borderRadius: 4, overflow: "hidden" },
  zoneBarFill: { height: "100%", borderRadius: 4 },
  heatmapGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  heatCell: { width: 44, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  heatCellText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  legendRow: { flexDirection: "row", gap: 14, flexWrap: "wrap" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.background, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.border,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  filterChip: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 6,
  },
  filterChipActive: { backgroundColor: C.tint, borderColor: C.tint },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  filterChipTextActive: { color: "#fff" },
  emptyBox: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  vehicleRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  vehicleTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  zoneBadge: { backgroundColor: C.tint + "15", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  zoneBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.tint },
  elapsedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  vehicleNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: 1, marginBottom: 2 },
  forceFreeBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: C.danger + "50", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  forceFreeBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.danger },
  rankText: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.tint },
  scorePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  scoreText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  blockBtn: { backgroundColor: C.dangerLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  blockBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.danger },
  unblockBtn: { backgroundColor: C.statusFree + "20", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  unblockBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.statusFree },
});
