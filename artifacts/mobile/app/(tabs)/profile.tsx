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
import { addSlot, deleteSlot } from "@workspace/api-client-react";

const C = Colors.light;

interface MenuRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
}

function MenuRow({ icon, label, subtitle, onPress, rightEl, danger }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[styles.menuIcon, { backgroundColor: danger ? C.dangerLight : C.background }]}>
        <Feather name={icon as any} size={18} color={danger ? C.danger : C.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: C.danger }]}>{label}</Text>
        {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
      </View>
      {rightEl ?? <Feather name="chevron-right" size={18} color={C.border} />}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, toggleAdmin } = useAuth();
  const { zones, refreshZones, showNotification } = useParking();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top + 16;

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
    if (!user?.isAdmin) {
      showNotification("Admin mode is required.");
      return;
    }
    Alert.alert(
      "Admin: Add Slot",
      "Choose a zone to add a slot to:",
      [
        ...zones.map(z => ({
          text: `Zone ${z.name} (${z.totalSlots} slots)`,
          onPress: () => handleAddSlot(z.id, z.name),
        })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const initials = user?.email?.substring(0, 2).toUpperCase() ?? "??";

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Feather name={user?.isAdmin ? "shield" : "user"} size={12} color={user?.isAdmin ? C.warning : C.textSecondary} />
          <Text style={[styles.roleText, user?.isAdmin && { color: C.warning }]}>
            {user?.isAdmin ? "Admin Mode" : "User"}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parking</Text>
        <View style={styles.sectionCard}>
          <MenuRow
            icon="navigation"
            label="Active Parking"
            subtitle="View current session"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/parking/active");
            }}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="clock"
            label="Parking History"
            subtitle="View past sessions"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/history");
            }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Admin</Text>
        <View style={styles.sectionCard}>
          <MenuRow
            icon="shield"
            label="Admin Mode"
            subtitle={user?.isAdmin ? "Enabled — can reset slots" : "Disabled — enable to manage slots"}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              toggleAdmin();
            }}
            rightEl={
              <Switch
                value={!!user?.isAdmin}
                onValueChange={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleAdmin();
                }}
                trackColor={{ false: C.border, true: C.warning + "80" }}
                thumbColor={user?.isAdmin ? C.warning : C.textSecondary}
              />
            }
          />
          {user?.isAdmin && (
            <>
              <View style={styles.divider} />
              <MenuRow
                icon="plus-circle"
                label="Add Parking Slot"
                subtitle="Add a new slot to a zone"
                onPress={handleAdminPanel}
              />
            </>
          )}
        </View>

        {user?.isAdmin && (
          <Text style={styles.adminHint}>
            Long-press occupied slots in Zone Detail to force reset them.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zone Overview</Text>
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
                <View style={[styles.menuIcon, { backgroundColor: C.infoLight }]}>
                  <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: C.info }}>Z{zone.name}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>Zone {zone.name}</Text>
                  <Text style={styles.menuSub}>{zone.freeSlots}/{zone.totalSlots} free</Text>
                </View>
                <View style={[
                  styles.zonePill,
                  { backgroundColor: zone.freeSlots === 0 ? C.dangerLight : zone.freeSlots <= 2 ? C.warningLight : C.successLight }
                ]}>
                  <Text style={[
                    styles.zonePillText,
                    { color: zone.freeSlots === 0 ? C.danger : zone.freeSlots <= 2 ? C.warning : C.success }
                  ]}>
                    {zone.freeSlots === 0 ? "Full" : zone.freeSlots <= 2 ? "Limited" : "Available"}
                  </Text>
                </View>
              </Pressable>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionCard}>
          <MenuRow
            icon="log-out"
            label="Sign Out"
            danger
            onPress={handleSignOut}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  email: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.background,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.textSecondary },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: C.text,
  },
  menuSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 66 },
  adminHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 8,
    marginLeft: 4,
    lineHeight: 18,
  },
  zonePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  zonePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
