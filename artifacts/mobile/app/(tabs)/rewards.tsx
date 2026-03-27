import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

const BADGES = [
  { id: "first_park", icon: "star", label: "First Park", desc: "Complete your first parking session", pointsReq: 10, color: C.gold },
  { id: "loyal_parker", icon: "award", label: "Loyal Parker", desc: "Earn 50 points total", pointsReq: 50, color: C.tintMid },
  { id: "century", icon: "zap", label: "Century Club", desc: "Reach 100 points", pointsReq: 100, color: "#E05A1B" },
  { id: "elite", icon: "shield", label: "Elite Parker", desc: "Earn 200+ points", pointsReq: 200, color: C.tint },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    if (user?.userId) {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }
  }, []);

  const points = user?.points ?? 0;
  const violations = user?.violationCount ?? 0;
  const isBlocked = user?.isBlockedUntil ? new Date(user.isBlockedUntil) > new Date() : false;
  const nextBadge = BADGES.find(b => points < b.pointsReq);
  const nextBadgeProgress = nextBadge ? Math.min(100, (points / nextBadge.pointsReq) * 100) : 100;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <Text style={styles.heroTitle}>Rewards</Text>
          <Text style={styles.heroSub}>Earn points for responsible parking</Text>

          {loading ? (
            <ActivityIndicator color="rgba(255,255,255,0.6)" style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.pointsHero}>
              <View style={styles.pointsIconWrap}>
                <Feather name="star" size={26} color={C.gold} />
              </View>
              <Text style={styles.pointsNum}>{points}</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>

              {nextBadge && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressNext}>Next: {nextBadge.label}</Text>
                    <Text style={styles.progressCount}>{points}/{nextBadge.pointsReq}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${nextBadgeProgress}%` as any }]} />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.content}>
          {isBlocked && (
            <View style={styles.blockedBanner}>
              <View style={styles.blockedIcon}>
                <Feather name="alert-octagon" size={20} color={C.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.blockedTitle}>Account Restricted</Text>
                <Text style={styles.blockedSub}>
                  Blocked until {new Date(user!.isBlockedUntil!).toLocaleDateString()}. Contact admin.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: C.statusFreeLight }]}>
                <Feather name="check-circle" size={20} color={C.statusFree} />
              </View>
              <Text style={styles.statNum}>{points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: violations > 0 ? C.dangerLight : C.statusFreeLight }]}>
                <Feather name="alert-triangle" size={20} color={violations > 0 ? C.danger : C.statusFree} />
              </View>
              <Text style={[styles.statNum, violations > 0 && { color: C.danger }]}>{violations}</Text>
              <Text style={styles.statLabel}>Violations</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: C.goldLight }]}>
                <Feather name="award" size={20} color={C.gold} />
              </View>
              <Text style={styles.statNum}>{BADGES.filter(b => points >= b.pointsReq).length}</Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>How to Earn</Text>
          <View style={styles.rulesCard}>
            {[
              { icon: "log-out", label: "Proper Exit", desc: "Tap EXIT before leaving the slot", pts: "+10 pts", color: C.statusFree },
              { icon: "alert-triangle", label: "1st Violation", desc: "Leave without pressing EXIT", pts: "−5 pts", color: C.warning },
              { icon: "x-circle", label: "2nd Violation", desc: "Points reset + 1-day account block", pts: "RESET", color: C.danger },
            ].map((r, i, arr) => (
              <React.Fragment key={r.label}>
                <View style={styles.ruleRow}>
                  <View style={[styles.ruleIcon, { backgroundColor: r.color + "15" }]}>
                    <Feather name={r.icon as any} size={18} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ruleLabel}>{r.label}</Text>
                    <Text style={styles.ruleDesc}>{r.desc}</Text>
                  </View>
                  <View style={[styles.ptsBadge, { backgroundColor: r.color + "15" }]}>
                    <Text style={[styles.ptsText, { color: r.color }]}>{r.pts}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.ruleDivider} />}
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Badges</Text>
          <View style={styles.badgesGrid}>
            {BADGES.map(badge => {
              const earned = points >= badge.pointsReq;
              return (
                <View key={badge.id} style={[styles.badgeCard, !earned && styles.badgeCardLocked]}>
                  <View style={[styles.badgeIconWrap, { backgroundColor: earned ? badge.color + "18" : C.borderLight }]}>
                    <Feather name={badge.icon as any} size={24} color={earned ? badge.color : C.textSecondary} />
                  </View>
                  {earned && (
                    <View style={[styles.earnedCheckWrap, { backgroundColor: badge.color }]}>
                      <Feather name="check" size={9} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.badgeLabel, !earned && { color: C.textSecondary }]}>{badge.label}</Text>
                  <Text style={styles.badgeReq}>{badge.pointsReq} pts</Text>
                </View>
              );
            })}
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
  heroTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 20,
  },
  pointsHero: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 20,
    alignItems: "center",
  },
  pointsIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(201,160,42,0.2)",
    borderWidth: 1,
    borderColor: C.gold + "55",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  pointsNum: {
    fontSize: 48,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 56,
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  progressWrap: { width: "100%" },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressNext: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  progressCount: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.gold },
  progressTrack: {
    height: 7,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: C.gold, borderRadius: 4 },
  content: { paddingHorizontal: 18, paddingTop: 18 },
  blockedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.dangerLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.danger + "30",
  },
  blockedIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  blockedTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.danger },
  blockedSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.danger, marginTop: 2, lineHeight: 17 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 22 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  rulesCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 22,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  ruleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  ruleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  ruleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  ptsBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ptsText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  ruleDivider: { height: 1, backgroundColor: C.borderLight, marginVertical: 4 },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24 },
  badgeCard: {
    width: "46%",
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: C.border,
    position: "relative",
  },
  badgeCardLocked: { opacity: 0.55 },
  badgeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  earnedCheckWrap: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center" },
  badgeReq: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
