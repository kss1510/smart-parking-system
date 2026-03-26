import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Platform,
  Animated,
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

const ROLE_COLORS = {
  admin: { bg: "#EFF6FF", text: "#1A6BFF", border: "#BFDBFE" },
  faculty: { bg: "#F5F3FF", text: "#8B5CF6", border: "#DDD6FE" },
  student: { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
};

interface MenuRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightEl?: React.ReactNode;
  danger?: boolean;
  iconBg?: string;
  iconColor?: string;
}

function MenuRow({ icon, label, subtitle, onPress, rightEl, danger, iconBg, iconColor }: MenuRowProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.menuRow, { transform: [{ scale }] }]}>
        <View style={[
          styles.menuIcon,
          {
            backgroundColor: danger ? "#FEF2F2" : iconBg ?? "#F3F4F6",
          }
        ]}>
          <Feather
            name={icon as any}
            size={17}
            color={danger ? "#EF4444" : iconColor ?? C.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.menuLabel, danger && { color: "#EF4444" }]}>{label}</Text>
          {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
        </View>
        {rightEl ?? <Feather name="chevron-right" size={16} color={C.border} />}
      </Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshUser } = useAuth();

  React.useEffect(() => {
    refreshUser();
  }, []);

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
    if (!user?.isAdmin) return;
    Alert.alert(
      "Add Parking Slot",
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

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  const roleKey = user?.isAdmin ? "admin" : user?.isFaculty ? "faculty" : "student";
  const roleLabel = user?.isAdmin ? "Administrator" : user?.isFaculty ? "Faculty" : "Student";
  const roleColors = ROLE_COLORS[roleKey];

  const isBlocked = user?.isBlockedUntil && new Date(user.isBlockedUntil) > new Date();

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {isBlocked && (
        <View style={styles.blockedBanner}>
          <Feather name="alert-octagon" size={16} color="#fff" />
          <Text style={styles.blockedText}>Account restricted until {new Date(user!.isBlockedUntil!).toLocaleDateString()}</Text>
        </View>
      )}

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, user?.isAdmin && styles.avatarAdmin]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {user?.isAdmin && (
            <View style={styles.adminBadgeIcon}>
              <Feather name="shield" size={12} color="#fff" />
            </View>
          )}
        </View>

        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.registrationId && (
          <Text style={styles.regId}>Reg ID: {user.registrationId}</Text>
        )}

        <View style={[styles.roleBadge, { backgroundColor: roleColors.bg, borderColor: roleColors.border }]}>
          <Feather name={user?.isAdmin ? "shield" : user?.isFaculty ? "award" : "user"} size={11} color={roleColors.text} />
          <Text style={[styles.roleText, { color: roleColors.text }]}>{roleLabel}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Feather name="star" size={14} color="#F59E0B" />
            </View>
            <Text style={[styles.statNum, { color: "#F59E0B" }]}>{user?.points ?? 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.statIconWrap}>
              <Feather name="alert-triangle" size={14} color={(user?.violationCount ?? 0) > 0 ? "#EF4444" : "#9CA3AF"} />
            </View>
            <Text style={[styles.statNum, { color: (user?.violationCount ?? 0) > 0 ? "#EF4444" : C.text }]}>
              {user?.violationCount ?? 0}
            </Text>
            <Text style={styles.statLabel}>Violations</Text>
          </View>
          {user?.vehicleNumber && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.statIconWrap}>
                  <Feather name="truck" size={14} color="#1A6BFF" />
                </View>
                <Text style={[styles.statNum, { fontSize: 11 }]}>{user.vehicleNumber}</Text>
                <Text style={styles.statLabel}>Vehicle</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {user?.isAdmin && (
        <View style={styles.adminCard}>
          <View style={styles.adminCardHeader}>
            <View style={styles.adminCardIconWrap}>
              <Feather name="shield" size={18} color="#1A6BFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminCardTitle}>Admin Tools</Text>
              <Text style={styles.adminCardSub}>Manage parking system</Text>
            </View>
          </View>
          <View style={styles.adminGrid}>
            <Pressable
              style={({ pressed }) => [styles.adminGridBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin/scanner"); }}
            >
              <View style={[styles.adminGridIcon, { backgroundColor: "#EFF6FF" }]}>
                <Feather name="camera" size={20} color="#1A6BFF" />
              </View>
              <Text style={styles.adminGridLabel}>Scan QR</Text>
              <Text style={styles.adminGridSub}>Verify entry</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.adminGridBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push("/admin/dashboard"); }}
            >
              <View style={[styles.adminGridIcon, { backgroundColor: "#F0FDF4" }]}>
                <Feather name="bar-chart-2" size={20} color="#16A34A" />
              </View>
              <Text style={styles.adminGridLabel}>Dashboard</Text>
              <Text style={styles.adminGridSub}>Analytics</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.adminGridBtn, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); handleAdminPanel(); }}
            >
              <View style={[styles.adminGridIcon, { backgroundColor: "#FFF7ED" }]}>
                <Feather name="plus-circle" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.adminGridLabel}>Add Slot</Text>
              <Text style={styles.adminGridSub}>Expand zone</Text>
            </Pressable>
          </View>
          <Text style={styles.adminHint}>
            Long-press any occupied slot in zone view to force-reset it.
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Parking</Text>
        <View style={styles.sectionCard}>
          <MenuRow
            icon="navigation"
            label="Active Parking"
            subtitle="View your current session"
            iconBg="#EFF6FF"
            iconColor="#1A6BFF"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/parking/active"); }}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="clock"
            label="Parking History"
            subtitle="See all past sessions"
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/history"); }}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="award"
            label="Rewards & Points"
            subtitle="Badges, points and benefits"
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/(tabs)/rewards"); }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Zones</Text>
        <View style={styles.sectionCard}>
          {zones.map((zone, i) => {
            const pct = zone.totalSlots > 0 ? ((zone.occupiedSlots + zone.reservedSlots) / zone.totalSlots) * 100 : 0;
            const statusColor = zone.freeSlots === 0 ? "#EF4444" : zone.freeSlots <= 2 ? "#F59E0B" : "#22C55E";
            return (
              <React.Fragment key={zone.id}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.8 : 1 }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({ pathname: "/zone/[id]", params: { id: String(zone.id), name: zone.name } });
                  }}
                >
                  <View style={[styles.menuIcon, { backgroundColor: "#EFF6FF" }]}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#1A6BFF" }}>Z{zone.name}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>Zone {zone.name}</Text>
                    <View style={styles.zoneBarRow}>
                      <View style={styles.zoneBarBg}>
                        <View style={[styles.zoneBarFill, { width: `${pct}%` as any, backgroundColor: statusColor }]} />
                      </View>
                      <Text style={styles.menuSub}>{zone.freeSlots}/{zone.totalSlots} free</Text>
                    </View>
                  </View>
                  <View style={[styles.zonePill, { backgroundColor: statusColor + "20" }]}>
                    <Text style={[styles.zonePillText, { color: statusColor }]}>
                      {zone.freeSlots === 0 ? "Full" : zone.freeSlots <= 2 ? "Low" : "Open"}
                    </Text>
                  </View>
                </Pressable>
              </React.Fragment>
            );
          })}
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
  container: { paddingHorizontal: 16 },

  blockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  blockedText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#fff", flex: 1 },

  profileCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A6BFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A6BFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarAdmin: { backgroundColor: "#1A6BFF" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  adminBadgeIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#1A6BFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

  userName: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 2 },
  email: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 2 },
  regId: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 8 },

  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  statsRow: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: C.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statIconWrap: { marginBottom: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: C.border, alignSelf: "center" },
  statNum: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.text },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary },

  adminCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  adminCardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  adminCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1A6BFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  adminCardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1E3A5F" },
  adminCardSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4B7EC8" },
  adminGrid: { flexDirection: "row", gap: 8 },
  adminGridBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  adminGridIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  adminGridLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text },
  adminGridSub: { fontSize: 10, fontFamily: "Inter_400Regular", color: C.textSecondary },
  adminHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4B7EC8",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 16,
  },

  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 64 },

  zoneBarRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  zoneBarBg: { flex: 1, height: 4, backgroundColor: C.borderLight, borderRadius: 4, overflow: "hidden" },
  zoneBarFill: { height: "100%", borderRadius: 4 },
  zonePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  zonePillText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
