import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  Platform, Alert, ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

type WaitStatus =
  | { status: "WAITING"; waitingId: number; position: number; total: number; expiresAt: string; zoneId: number }
  | { status: "GRANTED"; slotId: number; qrToken: string; slotNumber: string; zoneId: number; waitingId: number }
  | { status: "NONE" }
  | null;

export default function WaitingScreen() {
  const { waitingId, position: initPos, zoneId, zoneName, vehicleNumber } = useLocalSearchParams<{
    waitingId: string; position: string; zoneId: string; zoneName: string; vehicleNumber: string;
  }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { refreshZones, refreshActiveSession, showNotification } = useParking();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [waitStatus, setWaitStatus] = useState<WaitStatus>(null);
  const [position, setPosition] = useState(parseInt(initPos ?? "1", 10));
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(300);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confirmedRef = useRef(false);

  const fetchStatus = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const data = await customFetch<WaitStatus>(`/api/users/${user.userId}/waiting-status`);
      setWaitStatus(data);
      if (data?.status === "WAITING") {
        setPosition(data.position);
      }
      if (data?.status === "GRANTED" && !confirmedRef.current) {
        confirmedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showNotification("Your slot is ready! Show QR to security.");
      }
    } catch {}
  }, [user?.userId]);

  useEffect(() => {
    fetchStatus();
    pollRef.current = setInterval(fetchStatus, 8000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchStatus]);

  useEffect(() => {
    if (waitStatus?.status !== "GRANTED") return;
    if (qrCountdown <= 0) {
      showNotification("QR expired. Slot has been released.");
      router.replace("/(tabs)");
      return;
    }
    const t = setTimeout(() => setQrCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [qrCountdown, waitStatus?.status]);

  useEffect(() => {
    if (waitStatus?.status !== "GRANTED") return;
    const slotId = (waitStatus as any).slotId;
    const zid = (waitStatus as any).zoneId;
    if (!slotId || !zid) return;

    const poll = async () => {
      try {
        const slots = await customFetch<any[]>(`/api/slots/zone/${zid}`);
        const our = slots.find((s: any) => String(s.id) === String(slotId));
        if (our?.status === "OCCUPIED") {
          if (pollRef.current) clearInterval(pollRef.current);
          await refreshZones();
          await refreshActiveSession(vehicleNumber || undefined);
          showNotification("Security confirmed your entry! Parking is active.");
          setTimeout(() => router.replace("/parking/active"), 1200);
        }
      } catch {}
    };

    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [waitStatus?.status]);

  const handleLeaveQueue = () => {
    Alert.alert(
      "Leave Queue",
      "Are you sure you want to leave the waiting list? You'll lose your position.",
      [
        { text: "Stay in Queue", style: "cancel" },
        {
          text: "Leave", style: "destructive", onPress: async () => {
            if (!user?.userId) return;
            setLeaving(true);
            try {
              await customFetch(`/api/users/${user.userId}/leave-waiting`, { method: "POST" });
              showNotification("Removed from waiting list.");
              router.replace("/(tabs)");
            } catch {
              showNotification("Failed to leave queue.");
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  };

  const granted = waitStatus?.status === "GRANTED" ? waitStatus as any : null;
  const timerMins = Math.floor(qrCountdown / 60);
  const timerSecs = qrCountdown % 60;
  const timerDisplay = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;

  if (granted) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Slot Ready!</Text>
            <Text style={styles.headerSub}>Zone {zoneName} · Show QR to security</Text>
          </View>
          <View style={[styles.liveBadge, { backgroundColor: "#065F46" }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>GRANTED</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Slot {granted.slotNumber}</Text>
            <Text style={styles.qrSub}>Zone {zoneName}</Text>
            <View style={styles.qrBox}>
              <QRCode value={granted.qrToken} size={180} color={C.tint} backgroundColor="#fff" />
            </View>
            <View style={styles.countdownRow}>
              <Feather name="clock" size={14} color={C.textSecondary} />
              <Text style={styles.countdownText}>Expires in {timerDisplay}</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Feather name="check-circle" size={20} color="#059669" />
            <Text style={styles.infoText}>
              Your slot has been reserved from the waiting list. Show this QR to security at the entrance.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.backBtn}>
          <Feather name="x" size={20} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Waiting Queue</Text>
          <Text style={styles.headerSub}>Zone {zoneName}</Text>
        </View>
        <Pressable onPress={fetchStatus} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={styles.positionCard}>
          <Text style={styles.positionLabel}>Your Position</Text>
          <Text style={styles.positionNumber}>#{position}</Text>
          {waitStatus?.status === "WAITING" && (
            <Text style={styles.positionSub}>
              {waitStatus.total} user{waitStatus.total !== 1 ? "s" : ""} in queue for Zone {zoneName}
            </Text>
          )}
          <View style={styles.pulsingRing}>
            <Feather name="clock" size={36} color={C.gold} />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={C.tint} />
          <Text style={styles.infoText}>
            Higher-priority users (score ≥ 0) are ahead of you. When a slot opens, you'll automatically be assigned one.
            Check back here or pull to refresh.
          </Text>
        </View>

        <View style={styles.howCard}>
          <Text style={styles.howTitle}>Priority Queue Rules</Text>
          {[
            { icon: "user-check", color: "#059669", text: "Users with score ≥ 0 are served first" },
            { icon: "clock", color: C.gold, text: "Within each tier, earliest request wins" },
            { icon: "zap", color: "#3B82F6", text: "When a slot opens, you're auto-assigned" },
            { icon: "alert-triangle", color: "#DC2626", text: "Queue expires in 30 min if not granted" },
          ].map((item, i) => (
            <View key={i} style={styles.howRow}>
              <View style={[styles.howIcon, { backgroundColor: item.color + "15" }]}>
                <Feather name={item.icon as any} size={14} color={item.color} />
              </View>
              <Text style={styles.howText}>{item.text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleLeaveQueue}
          disabled={leaving}
          style={({ pressed }) => [styles.leaveBtn, { opacity: pressed || leaving ? 0.7 : 1 }]}
        >
          {leaving ? (
            <ActivityIndicator color={C.statusOccupied} size="small" />
          ) : (
            <>
              <Feather name="log-out" size={16} color={C.statusOccupied} />
              <Text style={styles.leaveBtnText}>Leave Queue</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    backgroundColor: C.tint,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginTop: 2 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6EE7B7" },
  liveText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  positionCard: {
    backgroundColor: C.tint,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  positionLabel: {
    fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.65)", letterSpacing: 0.8, textTransform: "uppercase",
  },
  positionNumber: {
    fontSize: 72, fontFamily: "Inter_700Bold", color: C.gold, lineHeight: 80,
  },
  positionSub: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)", textAlign: "center",
  },
  pulsingRing: {
    marginTop: 12,
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  infoCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: "row", gap: 12, alignItems: "flex-start",
  },
  infoText: {
    flex: 1, fontSize: 13, fontFamily: "Inter_400Regular",
    color: C.text, lineHeight: 20,
  },
  howCard: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 16, gap: 12,
  },
  howTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold", color: C.text,
    marginBottom: 4, letterSpacing: 0.2,
  },
  howRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  howIcon: {
    width: 30, height: 30, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  howText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  leaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 14, borderWidth: 1.5, borderColor: "#DC2626",
    padding: 16, backgroundColor: "#FEF2F2",
  },
  leaveBtnText: {
    fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#DC2626",
  },
  qrCard: {
    backgroundColor: "#fff", borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border,
    padding: 24, alignItems: "center", gap: 6,
    shadowColor: C.tint, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
  },
  qrTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text },
  qrSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
  qrBox: {
    padding: 16, backgroundColor: "#fff", borderRadius: 12,
    marginTop: 8, marginBottom: 4,
  },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  countdownText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary },
});
