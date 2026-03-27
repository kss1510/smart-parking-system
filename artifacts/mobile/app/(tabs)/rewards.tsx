import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Platform,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

const C = Colors.light;

interface LeaderboardUser {
  userId: number;
  name: string | null;
  registrationId: string | null;
  priorityScore: number;
  violationCount: number;
}

function getTier(score: number): { label: string; color: string; icon: string; bg: string } {
  if (score >= 5)  return { label: "Platinum", color: "#8B5CF6", icon: "award",          bg: "#8B5CF615" };
  if (score >= 3)  return { label: "Gold",     color: C.gold,    icon: "star",           bg: C.gold + "15" };
  if (score >= 1)  return { label: "Silver",   color: "#6B7280", icon: "shield",         bg: "#6B728015" };
  if (score === 0) return { label: "Bronze",   color: "#92400E", icon: "user",           bg: "#92400E12" };
  return           { label: "Penalised",       color: C.danger,  icon: "alert-triangle", bg: C.dangerLight };
}

const MEDAL_COLORS = ["#F59E0B", "#9CA3AF", "#CD7C2F"];

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await customFetch<LeaderboardUser[]>("/api/auth/leaderboard");
      setUsers(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeaderboard(); }, []);

  const myRank = users.findIndex(u => u.userId === user?.userId) + 1;
  const myEntry = users.find(u => u.userId === user?.userId);
  const myScore = myEntry?.priorityScore ?? 0;
  const myTier = getTier(myScore);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLeaderboard(); }} tintColor={C.tint} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Feather name="bar-chart-2" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Leaderboard</Text>
              <Text style={styles.heroSub}>Priority score hierarchy</Text>
            </View>
          </View>

          {/* My rank card */}
          <View style={styles.myCard}>
            <View style={[styles.tierBadge, { backgroundColor: myTier.color + "22", borderColor: myTier.color + "55" }]}>
              <Feather name={myTier.icon as any} size={14} color={myTier.color} />
              <Text style={[styles.tierBadgeText, { color: myTier.color }]}>{myTier.label}</Text>
            </View>
            <View style={styles.myCardStats}>
              <View style={styles.myCardStat}>
                <Text style={styles.myCardNum}>{myRank > 0 ? `#${myRank}` : "—"}</Text>
                <Text style={styles.myCardLbl}>My Rank</Text>
              </View>
              <View style={styles.myCardDivider} />
              <View style={styles.myCardStat}>
                <Text style={[styles.myCardNum, { color: myScore >= 0 ? "#6EFFC4" : "#FF8080" }]}>
                  {myScore >= 0 ? `+${myScore}` : `${myScore}`}
                </Text>
                <Text style={styles.myCardLbl}>Priority Score</Text>
              </View>
              <View style={styles.myCardDivider} />
              <View style={styles.myCardStat}>
                <Text style={[styles.myCardNum, { color: (myEntry?.violationCount ?? 0) > 0 ? "#FF8080" : "#6EFFC4" }]}>
                  {myEntry?.violationCount ?? 0}
                </Text>
                <Text style={styles.myCardLbl}>Violations</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* Tier legend */}
          <Text style={styles.sectionLabel}>Tiers</Text>
          <View style={styles.sectionCard}>
            {[
              { label: "Platinum", color: "#8B5CF6", icon: "award",          desc: "Score ≥ 5" },
              { label: "Gold",     color: C.gold,    icon: "star",           desc: "Score 3–4" },
              { label: "Silver",   color: "#6B7280", icon: "shield",         desc: "Score 1–2" },
              { label: "Bronze",   color: "#92400E", icon: "user",           desc: "Score = 0" },
              { label: "Penalised",color: C.danger,  icon: "alert-triangle", desc: "Score < 0" },
            ].map((t, i, arr) => (
              <React.Fragment key={t.label}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.tierRow}>
                  <View style={[styles.menuIcon, { backgroundColor: t.color + "15" }]}>
                    <Feather name={t.icon as any} size={17} color={t.color} />
                  </View>
                  <Text style={styles.menuLabel}>{t.label}</Text>
                  <Text style={styles.menuSub}>{t.desc}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* Rankings */}
          <Text style={styles.sectionLabel}>Rankings</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.tint} />
              <Text style={styles.loadingText}>Loading leaderboard...</Text>
            </View>
          ) : users.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="bar-chart-2" size={36} color={C.textSecondary} />
              <Text style={styles.emptyTitle}>No users yet</Text>
              <Text style={styles.menuSub}>Be the first to park!</Text>
            </View>
          ) : (
            <View style={styles.sectionCard}>
              {users.map((u, i) => {
                const score = u.priorityScore ?? 0;
                const tier = getTier(score);
                const isMe = u.userId === user?.userId;
                const medal = MEDAL_COLORS[i];

                return (
                  <React.Fragment key={u.userId}>
                    {i > 0 && <View style={[styles.divider, isMe && { backgroundColor: C.tint + "30" }]} />}
                    <View style={[styles.rankRow, isMe && styles.rankRowMe]}>
                      <View style={styles.rankNumWrap}>
                        {i < 3 ? (
                          <View style={[styles.medalDot, { backgroundColor: medal + "25" }]}>
                            <Text style={[styles.medalText, { color: medal }]}>{i + 1}</Text>
                          </View>
                        ) : (
                          <Text style={styles.rankNum}>#{i + 1}</Text>
                        )}
                      </View>

                      <View style={[styles.menuIcon, { backgroundColor: tier.bg }]}>
                        <Feather name={tier.icon as any} size={16} color={tier.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[styles.menuLabel, isMe && { color: C.tint }]} numberOfLines={1}>
                            {u.name ?? `User #${u.userId}`}
                          </Text>
                          {isMe && (
                            <View style={styles.mePill}>
                              <Text style={styles.mePillText}>You</Text>
                            </View>
                          )}
                        </View>
                        {u.registrationId && <Text style={styles.menuSub}>{u.registrationId}</Text>}
                        <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
                      </View>

                      <View style={[styles.scorePill, { backgroundColor: tier.bg }]}>
                        <Text style={[styles.scoreText, { color: tier.color }]}>
                          {score >= 0 ? `+${score}` : `${score}`}
                        </Text>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          )}

          {/* How scoring works */}
          <Text style={styles.sectionLabel}>How Scoring Works</Text>
          <View style={styles.sectionCard}>
            {[
              { icon: "log-in",        label: "Entry Scan",    desc: "Security scans your QR at gate",    pts: "+1",  color: C.statusFree },
              { icon: "log-out",       label: "Proper Exit",   desc: "You tap Exit before leaving",       pts: "−1",  color: C.tint },
              { icon: "alert-triangle",label: "Force-Freed",   desc: "Admin releases your slot (penalty)","pts": "−1 net", color: C.danger },
            ].map((r, i, arr) => (
              <React.Fragment key={r.label}>
                {i > 0 && <View style={styles.divider} />}
                <View style={styles.menuRow}>
                  <View style={[styles.menuIcon, { backgroundColor: r.color + "15" }]}>
                    <Feather name={r.icon as any} size={17} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{r.label}</Text>
                    <Text style={styles.menuSub}>{r.desc}</Text>
                  </View>
                  <View style={[styles.ptsPill, { backgroundColor: r.color + "15" }]}>
                    <Text style={[styles.ptsText, { color: r.color }]}>{r.pts}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: {},
  heroHeader: { backgroundColor: C.tint, paddingHorizontal: 20, paddingBottom: 24 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.62)", marginTop: 2 },
  myCard: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 16 },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 12 },
  tierBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  myCardStats: { flexDirection: "row" },
  myCardStat: { flex: 1, alignItems: "center" },
  myCardNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  myCardLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 3 },
  myCardDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.14)", marginVertical: 4 },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 },
  sectionCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 18, borderWidth: 1, borderColor: C.border, shadowColor: "#004D36", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  tierRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  loadingBox: { alignItems: "center", padding: 40, gap: 10 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  emptyBox: { alignItems: "center", padding: 40, gap: 8 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.text },
  rankRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  rankRowMe: { backgroundColor: C.tint + "06" },
  rankNumWrap: { width: 32, alignItems: "center" },
  rankNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.textSecondary },
  medalDot: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  medalText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  mePill: { backgroundColor: C.tint + "15", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  mePillText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: C.tint },
  tierText: { fontSize: 11, fontFamily: "Inter_500Medium", marginTop: 2 },
  scorePill: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  scoreText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  ptsPill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ptsText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
