import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

function formatDuration(ms: number) {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function ActiveParkingScreen() {
  const insets = useSafeAreaInsets();
  const { activeSession, refreshZones, refreshActiveSession, showNotification } = useParking();
  const { user, refreshUser } = useAuth();
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!activeSession?.entryTime) return;
    const entry = new Date(activeSession.entryTime).getTime();
    const update = () => setElapsedMs(Date.now() - entry);
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.entryTime]);

  const handleExit = () => {
    if (!activeSession) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowConfirm(true);
  };

  const confirmExit = async () => {
    if (!activeSession) return;
    setShowConfirm(false);
    setLoading(true);
    try {
      const result = await customFetch<{ message: string; duration: number; pointsEarned: number }>(
        `/api/slots/${activeSession.slotId}/exit`,
        { method: "POST" }
      );
      await refreshZones();
      await refreshActiveSession();
      await refreshUser();
      showNotification(`Parked ${result.duration} min · +${result.pointsEarned} points earned!`);
      router.replace("/(tabs)");
    } catch (e: any) {
      showNotification(e?.message ?? "Failed to exit. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  if (!activeSession) {
    return (
      <View style={styles.screen}>
        <View style={[styles.heroHeader, { paddingTop: topPad + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.heroHeaderTitle}>Active Parking</Text>
        </View>
        <View style={styles.noSession}>
          <View style={styles.noSessionIcon}>
            <Feather name="map-pin" size={36} color={C.textSecondary} />
          </View>
          <Text style={styles.noSessionTitle}>No active session</Text>
          <Text style={styles.noSessionText}>You don't have a vehicle currently parked.</Text>
          <Pressable onPress={() => router.replace("/(tabs)")} style={styles.goHomeBtn}>
            <Feather name="home" size={16} color="#fff" />
            <Text style={styles.goHomeBtnText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const entryDate = new Date(activeSession.entryTime);

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 16 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <Text style={styles.heroHeaderTitle}>Active Parking</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.vehicleHero}>
          <View style={styles.vehicleIconBg}>
            <Feather name="truck" size={32} color={C.tint} />
          </View>
          <Text style={styles.vehicleNum}>{activeSession.vehicleNumber}</Text>
          <View style={styles.slotChips}>
            <View style={styles.slotChip}>
              <Text style={styles.slotChipLabel}>Zone</Text>
              <Text style={styles.slotChipVal}>{activeSession.zoneName}</Text>
            </View>
            <View style={styles.slotChipDivider} />
            <View style={styles.slotChip}>
              <Text style={styles.slotChipLabel}>Slot</Text>
              <Text style={styles.slotChipVal}>{activeSession.slotNumber}</Text>
            </View>
          </View>
        </View>

        <View style={styles.timerCard}>
          <View style={styles.timerInner}>
            <Text style={styles.timerLabel}>PARKED DURATION</Text>
            <Text style={styles.timerValue}>{formatDuration(elapsedMs)}</Text>
            <Text style={styles.timerSince}>
              Since {entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} on {entryDate.toLocaleDateString([], { month: "short", day: "numeric" })}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {[
            { icon: "calendar", label: "Entry Date", value: entryDate.toLocaleDateString([], { weekday: "short", month: "long", day: "numeric" }) },
            { icon: "clock", label: "Entry Time", value: entryDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) },
            { icon: "map-pin", label: "Location", value: `Zone ${activeSession.zoneName} · Slot ${activeSession.slotNumber}` },
            { icon: "star", label: "Current Points", value: `${user?.points ?? 0} pts (+10 on proper exit)` },
          ].map((row, i, arr) => (
            <React.Fragment key={row.label}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Feather name={row.icon as any} size={15} color={C.tint} />
                </View>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.infoRowDivider} />}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.pointsHint}>
          <Feather name="star" size={14} color={C.gold} />
          <Text style={styles.pointsHintText}>
            Tap <Text style={{ fontFamily: "Inter_700Bold", color: C.tint }}>Exit Parking</Text> to earn +10 points and free the slot
          </Text>
        </View>

        <Pressable
          onPress={handleExit}
          disabled={loading}
          style={({ pressed }) => [styles.exitBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="log-out" size={20} color="#fff" />
              <Text style={styles.exitBtnText}>Exit Parking</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Feather name="log-out" size={26} color={C.tint} />
            </View>
            <Text style={styles.modalTitle}>Confirm Exit</Text>
            <Text style={styles.modalBody}>
              Exit parking for vehicle{"\n"}
              <Text style={styles.modalVehicle}>{activeSession?.vehicleNumber}</Text>?{"\n\n"}
              You'll earn <Text style={styles.modalPoints}>+10 points</Text> for a proper exit.
            </Text>
            <View style={styles.modalBtns}>
              <Pressable onPress={() => setShowConfirm(false)} style={[styles.modalBtn, styles.modalBtnCancel]}>
                <Text style={styles.modalBtnCancelText}>Stay</Text>
              </Pressable>
              <Pressable onPress={confirmExit} style={[styles.modalBtn, styles.modalBtnExit]}>
                <Text style={styles.modalBtnExitText}>Exit Now</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 18 },
  heroHeader: {
    backgroundColor: C.tint,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 0,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#6EFFC4" },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#6EFFC4", letterSpacing: 0.5 },
  vehicleHero: {
    backgroundColor: C.surface,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 16,
    borderRadius: 0,
  },
  vehicleIconBg: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: C.tint + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: C.tint + "25",
  },
  vehicleNum: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  slotChips: {
    flexDirection: "row",
    backgroundColor: C.background,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: C.border,
    gap: 32,
  },
  slotChip: { alignItems: "center" },
  slotChipLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  slotChipVal: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.tint },
  slotChipDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
  timerCard: {
    backgroundColor: C.tint,
    borderRadius: 18,
    marginBottom: 14,
    overflow: "hidden",
  },
  timerInner: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  timerLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1,
    marginBottom: 10,
  },
  timerValue: {
    fontSize: 46,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -1,
    marginBottom: 8,
  },
  timerSince: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2 },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.tint + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.text, maxWidth: "50%" },
  infoRowDivider: { height: 1, backgroundColor: C.borderLight, marginVertical: 8, marginLeft: 42 },
  pointsHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.goldLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.gold + "35",
  },
  pointsHintText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.text,
    lineHeight: 18,
  },
  exitBtn: {
    backgroundColor: C.statusOccupied,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 8,
    shadowColor: C.statusOccupied,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  exitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  noSession: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  noSessionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.borderLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  noSessionTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.text },
  noSessionText: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  goHomeBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  goHomeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 32 },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 16,
  },
  modalIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.tint + "12",
    borderWidth: 1.5,
    borderColor: C.tint + "30",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 12 },
  modalBody: { fontSize: 15, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 24, marginBottom: 24 },
  modalVehicle: { fontFamily: "Inter_700Bold", color: C.text, letterSpacing: 1 },
  modalPoints: { fontFamily: "Inter_700Bold", color: C.tint },
  modalBtns: { flexDirection: "row", gap: 12, width: "100%" },
  modalBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  modalBtnCancel: { backgroundColor: C.background, borderWidth: 1.5, borderColor: C.border },
  modalBtnExit: { backgroundColor: C.tint },
  modalBtnCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  modalBtnExitText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
