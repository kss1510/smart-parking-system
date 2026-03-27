import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useParking } from "@/context/ParkingContext";

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshUser } = useAuth();

  React.useEffect(() => { refreshUser(); }, []);

  const { zones } = useParking();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
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

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() ?? "??";

  const priorityScore = user?.priorityScore ?? 0;

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
          {user?.registrationId && (
            <Text style={styles.heroReg}>ID: {user.registrationId}</Text>
          )}
          <View style={[styles.rolePill, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Feather name="user" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.rolePillText, { color: "rgba(255,255,255,0.8)" }]}>
              Student / Faculty
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Feather name="bar-chart-2" size={14} color={priorityScore >= 0 ? "#6EFFC4" : "#FF8080"} style={{ marginBottom: 4 }} />
              <Text style={[styles.heroStatNum, { color: priorityScore >= 0 ? "#6EFFC4" : "#FF8080" }]}>
                {priorityScore >= 0 ? `+${priorityScore}` : `${priorityScore}`}
              </Text>
              <Text style={styles.heroStatLbl}>Priority</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Feather name="alert-triangle" size={14} color={(user?.violationCount ?? 0) > 0 ? "#FF8080" : "rgba(255,255,255,0.4)"} style={{ marginBottom: 4 }} />
              <Text style={[styles.heroStatNum, (user?.violationCount ?? 0) > 0 && { color: "#FF8080" }]}>
                {user?.violationCount ?? 0}
              </Text>
              <Text style={styles.heroStatLbl}>Violations</Text>
            </View>
            {user?.vehicleNumber && (
              <>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Feather name="truck" size={14} color="rgba(255,255,255,0.4)" style={{ marginBottom: 4 }} />
                  <Text style={styles.heroStatNum} numberOfLines={1}>{user.vehicleNumber}</Text>
                  <Text style={styles.heroStatLbl}>Vehicle</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Parking</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="navigation"
              label="Active Parking"
              subtitle="View your current session"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/parking/active"); }}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="clock"
              label="Parking History"
              subtitle="View past sessions"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/history"); }}
            />
          </View>

          <Text style={styles.sectionLabel}>Zone Overview</Text>
          <View style={styles.sectionCard}>
            {zones.map((zone, i) => (
              <React.Fragment key={zone.id}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/zone/[id]", params: { id: String(zone.id), name: zone.name } });
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: C.tint }]}>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" }}>{zone.name}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>Zone {zone.name}</Text>
                    <Text style={styles.menuSub}>{zone.freeSlots}/{zone.totalSlots} slots free</Text>
                  </View>
                  <View style={[styles.zonePill, {
                    backgroundColor: zone.freeSlots === 0 ? C.dangerLight : zone.freeSlots <= 2 ? C.warningLight : C.successLight
                  }]}>
                    <Text style={[styles.zonePillText, {
                      color: zone.freeSlots === 0 ? C.danger : zone.freeSlots <= 2 ? C.warning : C.success
                    }]}>
                      {zone.freeSlots === 0 ? "Full" : zone.freeSlots <= 2 ? "Limited" : "Open"}
                    </Text>
                  </View>
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          <View style={styles.sectionCard}>
            <MenuRow icon="log-out" label="Sign Out" danger onPress={handleSignOut} rightEl={<View />} />
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
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  heroName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  heroEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginBottom: 4 },
  heroReg: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.5)", marginBottom: 10 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  rolePillText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  heroStats: { flexDirection: "row", backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, gap: 0, width: "100%" },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.45)", marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.12)", marginVertical: 4 },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 },
  sectionCard: {
    backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 18,
    borderWidth: 1, borderColor: C.border,
    shadowColor: "#004D36", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  zonePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  zonePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
