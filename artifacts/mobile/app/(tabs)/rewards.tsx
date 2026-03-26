import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";

const C = Colors.light;

const BADGES = [
  { id: "first_park", icon: "star", label: "First Park", desc: "Complete your first parking session", pointsReq: 10, color: "#F59E0B" },
  { id: "loyal_parker", icon: "award", label: "Loyal Parker", desc: "Earn 50 points total", pointsReq: 50, color: "#8B5CF6" },
  { id: "century", icon: "zap", label: "Century Club", desc: "Reach 100 points", pointsReq: 100, color: "#EF4444" },
  { id: "elite", icon: "shield", label: "Elite", desc: "Earn 200+ points", pointsReq: 200, color: C.tint },
];

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

  useEffect(() => {
    if (user?.userId) {
      setLoading(true);
      refreshUser().finally(() => setLoading(false));
    }
  }, []);

  const points = user?.points ?? 0;
  const violations = user?.violationCount ?? 0;
  const isBlocked = user?.isBlockedUntil ? new Date(user.isBlockedUntil) > new Date() : false;

  const earnedBadges = BADGES.filter(b => points >= b.pointsReq);
  const nextBadge = BADGES.find(b => points < b.pointsReq);
  const nextBadgeProgress = nextBadge ? (points / nextBadge.pointsReq) * 100 : 100;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Rewards</Text>
      <Text style={styles.pageSub}>Earn points for good parking behavior</Text>

      {loading ? (
        <ActivityIndicator color={C.tint} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.pointsCard}>
            <View style={styles.pointsIconWrap}>
              <Feather name="star" size={28} color="#F59E0B" />
            </View>
            <Text style={styles.pointsNum}>{points}</Text>
            <Text style={styles.pointsLabel}>Total Points</Text>

            {nextBadge && (
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Next: {nextBadge.label}</Text>
                  <Text style={styles.progressCount}>{points}/{nextBadge.pointsReq}</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${Math.min(100, nextBadgeProgress)}%` }]} />
                </View>
              </View>
            )}

            {points >= 200 && (
              <View style={styles.eliteBadge}>
                <Feather name="shield" size={14} color={C.tint} />
                <Text style={styles.eliteBadgeText}>Elite Parker</Text>
              </View>
            )}
          </View>

          {isBlocked && (
            <View style={styles.blockedBanner}>
              <Feather name="alert-octagon" size={18} color={C.danger} />
              <View style={{ flex: 1 }}>
                <Text style={styles.blockedTitle}>Account Restricted</Text>
                <Text style={styles.blockedSub}>
                  Blocked until {new Date(user!.isBlockedUntil!).toLocaleDateString()}. Contact admin to resolve.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: C.statusFree + "20" }]}>
                <Feather name="check-circle" size={20} color={C.statusFree} />
              </View>
              <Text style={styles.statNum}>{points}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            <View style={[styles.statCard, { flex: 1 }]}>
              <View style={[styles.statIcon, { backgroundColor: violations > 0 ? C.dangerLight : C.statusFree + "20" }]}>
                <Feather name="alert-triangle" size={20} color={violations > 0 ? C.danger : C.statusFree} />
              </View>
              <Text style={[styles.statNum, violations > 0 && { color: C.danger }]}>{violations}</Text>
              <Text style={styles.statLabel}>Violations</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>How to Earn Points</Text>
          <View style={styles.ruleCard}>
            {[
              { icon: "log-out", label: "Proper Exit", desc: "Tap EXIT before leaving", pts: "+10 pts", color: C.statusFree },
              { icon: "alert-triangle", label: "1st Violation", desc: "Leave without exit", pts: "−5 pts", color: "#F59E0B" },
              { icon: "x-circle", label: "2nd Violation", desc: "Points reset + 1-day block", pts: "−ALL", color: C.danger },
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
                  <Text style={[styles.rulePts, { color: r.color }]}>{r.pts}</Text>
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
                  <View style={[styles.badgeIcon, { backgroundColor: earned ? badge.color + "20" : C.borderLight }]}>
                    <Feather name={badge.icon as any} size={24} color={earned ? badge.color : C.textSecondary} />
                  </View>
                  <Text style={[styles.badgeLabel, !earned && styles.badgeLabelLocked]}>{badge.label}</Text>
                  <Text style={styles.badgeDesc}>{badge.pointsReq} pts</Text>
                  {earned && (
                    <View style={styles.badgeEarnedTag}>
                      <Feather name="check" size={10} color={badge.color} />
                      <Text style={[styles.badgeEarnedText, { color: badge.color }]}>Earned</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {earnedBadges.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="gift" size={36} color={C.textSecondary} />
              <Text style={styles.emptyTitle}>Start Earning!</Text>
              <Text style={styles.emptySub}>Park and exit correctly to earn your first badge</Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  pageTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  pageSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 24 },
  pointsCard: {
    backgroundColor: C.surface,
    borderRadius: 24, padding: 28, alignItems: "center", marginBottom: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  pointsIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "#F59E0B20", alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  pointsNum: { fontSize: 52, fontFamily: "Inter_700Bold", color: C.text, lineHeight: 60 },
  pointsLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.textSecondary, marginBottom: 20 },
  progressSection: { width: "100%", marginTop: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.text },
  progressCount: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  progressTrack: { height: 8, backgroundColor: C.borderLight, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: C.tint, borderRadius: 4 },
  eliteBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.tint + "15", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 12,
  },
  eliteBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint },
  blockedBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.dangerLight, borderRadius: 16, padding: 16, marginBottom: 16,
  },
  blockedTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.danger },
  blockedSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.danger, marginTop: 2, lineHeight: 18 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 20, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statNum: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: C.textSecondary,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12,
  },
  ruleCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 4 },
  ruleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  ruleLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  ruleDesc: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  rulePts: { fontSize: 16, fontFamily: "Inter_700Bold" },
  ruleDivider: { height: 1, backgroundColor: C.borderLight, marginVertical: 10 },
  badgesGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
  },
  badgeCard: {
    width: "46%", backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  badgeCardLocked: { opacity: 0.6 },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  badgeLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center", marginBottom: 2 },
  badgeLabelLocked: { color: C.textSecondary },
  badgeDesc: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  badgeEarnedTag: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  badgeEarnedText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  emptyState: {
    alignItems: "center", padding: 32, gap: 10,
    backgroundColor: C.surface, borderRadius: 20,
  },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
});
