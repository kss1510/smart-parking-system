import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

const C = Colors.light;

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string | null;
  email: string;
  registrationId: string | null;
  priorityScore: number;
  points: number;
}

function PriorityBadge({ score }: { score: number }) {
  let label = "Neutral";
  let bg = "#E5E7EB";
  let color = "#6B7280";
  if (score > 0) {
    label = `+${score} Active`;
    bg = "#D1FAE5";
    color = "#065F46";
  } else if (score < 0) {
    label = `${score} Delayed`;
    bg = "#FEE2E2";
    color = "#991B1B";
  }
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <Text style={styles.medal}>🥇</Text>;
  if (rank === 2) return <Text style={styles.medal}>🥈</Text>;
  if (rank === 3) return <Text style={styles.medal}>🥉</Text>;
  return (
    <View style={styles.rankCircle}>
      <Text style={styles.rankNum}>{rank}</Text>
    </View>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await customFetch<LeaderboardEntry[]>("/api/users/leaderboard");
      setEntries(data);
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    if (user?.userId) refreshUser();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const myScore = user?.priorityScore ?? 0;
  const myEntry = entries.find(e => e.userId === user?.userId);
  const myRank = myEntry?.rank ?? null;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.tint} />}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroTitle}>Leaderboard</Text>
              <Text style={styles.heroSub}>Priority queue ranking</Text>
            </View>
            <Pressable onPress={onRefresh} style={styles.refreshBtn}>
              <Feather name="refresh-cw" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <View style={styles.myScoreCard}>
            <View style={styles.myScoreLeft}>
              <Text style={styles.myScoreLabel}>My Priority Score</Text>
              <Text style={[
                styles.myScoreNum,
                myScore > 0 ? { color: C.gold } : myScore < 0 ? { color: "#FF8080" } : { color: "#fff" }
              ]}>
                {myScore > 0 ? `+${myScore}` : myScore}
              </Text>
              {myRank && (
                <Text style={styles.myRankText}>Ranked #{myRank} campus-wide</Text>
              )}
            </View>
            <View style={styles.myScoreRight}>
              <View style={[styles.priorityRing, {
                borderColor: myScore > 0 ? C.gold : myScore < 0 ? "#FF8080" : "rgba(255,255,255,0.3)"
              }]}>
                <Feather
                  name={myScore > 0 ? "trending-up" : myScore < 0 ? "trending-down" : "minus"}
                  size={22}
                  color={myScore > 0 ? C.gold : myScore < 0 ? "#FF8080" : "rgba(255,255,255,0.5)"}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.infoCard}>
            <Feather name="info" size={14} color={C.tint} />
            <Text style={styles.infoText}>
              Score starts at <Text style={styles.infoBold}>0</Text>. Entry +1, Exit −1.{" "}
              Positive scores get <Text style={styles.infoBold}>nearest slot priority</Text>.
              Negative scores get delayed allocation.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Campus Ranking</Text>

          {loading ? (
            <ActivityIndicator color={C.tint} style={{ marginTop: 32 }} />
          ) : entries.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="users" size={32} color={C.border} />
              <Text style={styles.emptyText}>No users yet</Text>
            </View>
          ) : (
            entries.map(entry => {
              const isMe = entry.userId === user?.userId;
              return (
                <View
                  key={entry.userId}
                  style={[styles.entryCard, isMe && styles.entryCardMe]}
                >
                  <RankMedal rank={entry.rank} />

                  <View style={styles.entryInfo}>
                    <View style={styles.entryNameRow}>
                      <Text style={[styles.entryName, isMe && { color: C.tint }]} numberOfLines={1}>
                        {entry.name ?? entry.email.split("@")[0]}
                        {isMe ? " (You)" : ""}
                      </Text>
                    </View>
                    {entry.registrationId && (
                      <Text style={styles.entryReg}>{entry.registrationId}</Text>
                    )}
                  </View>

                  <View style={styles.entryRight}>
                    <Text style={[
                      styles.entryScore,
                      entry.priorityScore > 0 ? { color: "#059669" } : entry.priorityScore < 0 ? { color: "#DC2626" } : { color: C.textSecondary }
                    ]}>
                      {entry.priorityScore > 0 ? `+${entry.priorityScore}` : entry.priorityScore}
                    </Text>
                    <PriorityBadge score={entry.priorityScore} />
                  </View>
                </View>
              );
            })
          )}

          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>How Priority Works</Text>
            {[
              { icon: "log-in", color: "#059669", label: "Reserve slot", desc: "Score goes +1" },
              { icon: "log-out", color: "#DC2626", label: "Exit & release", desc: "Score goes −1" },
              { icon: "star", color: C.gold, label: "Positive score", desc: "Nearest slot allocated first" },
              { icon: "clock", color: "#6B7280", label: "Negative score", desc: "Farther slots allocated, lower priority" },
            ].map((item, i) => (
              <View key={i} style={styles.legendRow}>
                <View style={[styles.legendIcon, { backgroundColor: item.color + "15" }]}>
                  <Feather name={item.icon as any} size={14} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendDesc}>{item.desc}</Text>
                </View>
              </View>
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
  heroHeader: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  heroTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)", marginTop: 3 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  myScoreCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  myScoreLeft: { flex: 1 },
  myScoreLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.6 },
  myScoreNum: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff", marginTop: 4 },
  myRankText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 4 },
  myScoreRight: { marginLeft: 16 },
  priorityRing: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  body: { paddingHorizontal: 20, paddingTop: 20 },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: C.tint + "10",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: C.tint,
    marginBottom: 20,
    alignItems: "flex-start",
  },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 19 },
  infoBold: { fontFamily: "Inter_700Bold", color: C.tint },
  sectionLabel: {
    fontSize: 12, fontFamily: "Inter_700Bold", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
  },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  entryCardMe: {
    borderColor: C.tint + "40",
    backgroundColor: C.tint + "08",
  },
  medal: { fontSize: 26, width: 36, textAlign: "center" },
  rankCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.background,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
  },
  rankNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.textSecondary },
  entryInfo: { flex: 1, minWidth: 0 },
  entryNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  entryName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  entryReg: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  entryRight: { alignItems: "flex-end", gap: 4 },
  entryScore: { fontSize: 20, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary },
  legendCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  legendTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  legendIcon: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  legendLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text },
  legendDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
});
