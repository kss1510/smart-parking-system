import React from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

interface MenuRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
  accent?: string;
}

function MenuRow({ icon, label, subtitle, onPress, rightEl, danger, accent }: MenuRowProps) {
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
      {rightEl ?? <Feather name="chevron-right" size={17} color={C.border} />}
    </Pressable>
  );
}

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() ?? "AD";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Sign out of admin session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth");
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {user?.name && <Text style={styles.heroName}>{user.name}</Text>}
          <Text style={styles.heroEmail}>{user?.email}</Text>
          <View style={styles.adminPill}>
            <Feather name="shield" size={12} color={C.gold} />
            <Text style={styles.adminPillText}>Admin / Security Staff</Text>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Feather name="shield" size={14} color={C.gold} style={{ marginBottom: 4 }} />
              <Text style={styles.heroStatNum}>Admin</Text>
              <Text style={styles.heroStatLbl}>Role</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Feather name="activity" size={14} color="rgba(255,255,255,0.4)" style={{ marginBottom: 4 }} />
              <Text style={styles.heroStatNum}>Live</Text>
              <Text style={styles.heroStatLbl}>Monitoring</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Feather name="lock" size={14} color="rgba(255,255,255,0.4)" style={{ marginBottom: 4 }} />
              <Text style={styles.heroStatNum}>Full</Text>
              <Text style={styles.heroStatLbl}>Access</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Management</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="bar-chart-2"
              label="Dashboard"
              subtitle="Live monitoring, analytics & zone stats"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(admin-tabs)"); }}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="camera"
              label="Scan Student QR"
              subtitle="Verify entry at the parking gate"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(admin-tabs)/scanner"); }}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="plus-circle"
              label="Add Parking Slot"
              subtitle="Expand campus parking capacity"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(admin-tabs)/add-slot"); }}
            />
          </View>

          <Text style={styles.sectionLabel}>Priority Queue</Text>
          <View style={styles.sectionCard}>
            <View style={styles.infoSection}>
              <View style={styles.prioRow}>
                {[
                  { num: "+1", label: "On Entry", color: C.statusFree },
                  { num: "−1", label: "On Exit", color: C.tint },
                  { num: "−1", label: "No Exit", color: C.statusOccupied },
                ].map(p => (
                  <View key={p.label} style={[styles.prioChip, { backgroundColor: p.color + "15" }]}>
                    <Text style={[styles.prioNum, { color: p.color }]}>{p.num}</Text>
                    <Text style={styles.prioLbl}>{p.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.infoText}>
                Score 0 = ideal (always exits). Force-freeing a slot penalises the user −1 net, reducing their slot priority.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Admin Code</Text>
          <View style={styles.sectionCard}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: C.tint + "12" }]}>
                <Feather name="lock" size={17} color={C.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>Registration Code</Text>
                <Text style={styles.menuSub}>Required to register as admin</Text>
              </View>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>ADMIN123</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <MenuRow
              icon="log-out"
              label="Sign Out"
              danger
              onPress={handleSignOut}
              rightEl={<View />}
            />
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
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  avatarWrap: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2.5, borderColor: C.gold + "80",
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  heroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 3 },
  heroEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.62)", marginBottom: 10 },
  adminPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.gold + "30", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 20,
  },
  adminPillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.gold },
  heroStats: {
    flexDirection: "row", width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.14)", marginVertical: 4 },
  body: { paddingHorizontal: 18, paddingTop: 18 },
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
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  infoSection: { padding: 14, gap: 12 },
  prioRow: { flexDirection: "row", gap: 8 },
  prioChip: { flex: 1, borderRadius: 12, padding: 10, alignItems: "center" },
  prioNum: { fontSize: 20, fontFamily: "Inter_700Bold" },
  prioLbl: { fontSize: 10, fontFamily: "Inter_500Medium", color: C.textSecondary, marginTop: 2 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  codePill: { backgroundColor: C.tint + "12", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  codeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.tint, letterSpacing: 1.5 },
});
