import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useParking } from "@/context/ParkingContext";
import { addSlot } from "@workspace/api-client-react";

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
  const { user, signOut, toggleAdmin, refreshUser } = useAuth();

  React.useEffect(() => { refreshUser(); }, []);

  const { zones, refreshZones, showNotification } = useParking();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const handleAddSlot = async (zoneId: number, zoneName: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const nextNum = zone.totalSlots + 1;
    const slotNumber = `${zoneName}${nextNum}`;
    try {
      await addSlot({ zoneId, slotNumber });
      await refreshZones();
      showNotification(`Added slot ${slotNumber} to Zone ${zoneName}`);
    } catch {
      showNotification("Failed to add slot.");
    }
  };

  const handleAdminPanel = () => {
    if (!user?.isAdmin) { showNotification("Admin mode required."); return; }
    Alert.alert("Add Slot", "Choose a zone:", [
      ...zones.map(z => ({
        text: `Zone ${z.name} (${z.totalSlots} slots)`,
        onPress: () => handleAddSlot(z.id, z.name),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() ?? "??";

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
          <View style={[styles.rolePill, { backgroundColor: user?.isAdmin ? C.gold + "30" : "rgba(255,255,255,0.15)" }]}>
            <Feather name={user?.isAdmin ? "shield" : "user"} size={12} color={user?.isAdmin ? C.gold : "rgba(255,255,255,0.7)"} />
            <Text style={[styles.rolePillText, { color: user?.isAdmin ? C.gold : "rgba(255,255,255,0.8)" }]}>
              {user?.isAdmin ? "Admin Staff" : "Student / Faculty"}
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Feather name="star" size={14} color={C.gold} style={{ marginBottom: 4 }} />
              <Text style={styles.heroStatNum}>{user?.points ?? 0}</Text>
              <Text style={styles.heroStatLbl}>Points</Text>
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

          <Text style={styles.sectionLabel}>Admin</Text>
          <View style={styles.sectionCard}>
            <MenuRow
              icon="shield"
              label="Admin Mode"
              subtitle={user?.isAdmin ? "Enabled — full admin access" : "Disabled — enable to manage slots"}
              accent={C.gold}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleAdmin(); }}
              rightEl={
                <Switch
                  value={!!user?.isAdmin}
                  onValueChange={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleAdmin(); }}
                  trackColor={{ false: C.border, true: C.tint + "80" }}
                  thumbColor={user?.isAdmin ? C.tint : "#ccc"}
                />
              }
            />
            {user?.isAdmin && (
              <>
                <View style={styles.divider} />
                <MenuRow
                  icon="camera"
                  label="Scan Student QR"
                  subtitle="Approve student entry at gate"
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin/scanner"); }}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="bar-chart-2"
                  label="Admin Dashboard"
                  subtitle="Analytics, live vehicles & management"
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin/dashboard"); }}
                />
                <View style={styles.divider} />
                <MenuRow
                  icon="plus-circle"
                  label="Add Parking Slot"
                  subtitle="Expand a zone with a new slot"
                  onPress={handleAdminPanel}
                />
              </>
            )}
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
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2.5,
    borderColor: C.gold + "80",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  heroName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 3,
  },
  heroEmail: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.62)",
    marginBottom: 3,
  },
  heroReg: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
    marginBottom: 10,
  },
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  rolePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroStats: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingVertical: 14,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  heroStatLbl: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", marginTop: 2 },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.14)", marginVertical: 4 },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  zonePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  zonePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
