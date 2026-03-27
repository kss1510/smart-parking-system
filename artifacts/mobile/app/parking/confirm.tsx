import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import QRCode from "react-native-qrcode-svg";
import Colors from "@/constants/colors";
import { customFetch, type ReserveSlotResponse } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";
import { useAuth } from "@/context/AuthContext";
import ParkingMapView from "@/components/ParkingMapView";

const C = Colors.light;

const PLATE_REGEX = /^[A-Z]{2} \d{2} [A-Z]{2} \d{4}$/;

function formatPlate(raw: string): string {
  const clean = raw.replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10);
  const parts: string[] = [];
  if (clean.length > 0) parts.push(clean.slice(0, 2));
  if (clean.length > 2) parts.push(clean.slice(2, 4));
  if (clean.length > 4) parts.push(clean.slice(4, 6));
  if (clean.length > 6) parts.push(clean.slice(6, 10));
  return parts.join(" ");
}

export default function ConfirmParkingScreen() {
  const { slotId, slotNumber, zoneName, zoneId } = useLocalSearchParams<{
    slotId: string;
    slotNumber: string;
    zoneName: string;
    zoneId: string;
  }>();
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones, refreshActiveSession, selectedVehicle, setSelectedVehicle } = useParking();
  const { user } = useAuth();

  const [vehicleNumber, setVehicleNumber] = useState(formatPlate(selectedVehicle ?? user?.vehicleNumber ?? ""));
  const [vehicleError, setVehicleError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [pendingQrToken, setPendingQrToken] = useState<string | null>(null);
  const [mapPhase, setMapPhase] = useState<"none" | "navigating" | "arrived">("none");
  const [navStarted, setNavStarted] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [confirmed, setConfirmed] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!qrToken) return;
    if (countdown <= 0) {
      showNotification("Reservation expired. Slot has been released.");
      router.replace("/(tabs)");
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, qrToken]);

  useEffect(() => {
    if (!qrToken || !slotId || !zoneId) return;

    const poll = async () => {
      try {
        const slots = await customFetch<any[]>(`/api/slots/zone/${zoneId}`);
        const our = slots.find((s: any) => String(s.id) === String(slotId));
        if (our?.status === "OCCUPIED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setConfirmed(true);
          await refreshZones();
          await refreshActiveSession(vehicleNumber || undefined);
          showNotification("Security confirmed your entry! Parking is active.");
          setTimeout(() => router.replace("/parking/active"), 1200);
        }
      } catch {}
    };

    pollRef.current = setInterval(poll, 2000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [qrToken, slotId, zoneId]);

  const handleVehicleChange = (text: string) => {
    const formatted = formatPlate(text);
    setVehicleNumber(formatted);
    if (formatted.length > 0 && !PLATE_REGEX.test(formatted)) {
      setVehicleError("Format must be: AP 31 AC 2044");
    } else {
      setVehicleError("");
    }
  };

  const handleReserve = async () => {
    if (!vehicleNumber.trim()) {
      setVehicleError("Vehicle number is required to reserve a slot.");
      return;
    }
    if (!PLATE_REGEX.test(vehicleNumber)) {
      setVehicleError("Format must be: AP 31 AC 2044  (e.g. TS 09 AB 1234)");
      return;
    }
    setVehicleError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      const result = await customFetch<any>(`/api/slots/${slotId}/reserve`, {
        method: "POST",
        body: JSON.stringify({ vehicleNumber: vehicleNumber.trim().toUpperCase(), userId: user?.userId }),
      });

      if (result.status === "WAITING") {
        setSelectedVehicle(vehicleNumber.trim().toUpperCase());
        await refreshZones();
        router.replace({
          pathname: "/parking/waiting",
          params: {
            waitingId: String(result.waitingId),
            position: String(result.position),
            zoneId: String(result.zoneId),
            zoneName,
            vehicleNumber: vehicleNumber.trim().toUpperCase(),
          },
        });
        return;
      }

      setSelectedVehicle(vehicleNumber.trim().toUpperCase());
      setPendingQrToken(result.qrToken);
      setMapPhase("navigating");
      await refreshZones();
      showNotification(`Slot ${slotNumber} reserved! Navigate to the slot.`);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to reserve slot.";
      Alert.alert("Reservation Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if ((qrToken || pendingQrToken) && slotId) {
      setCancelling(true);
      try {
        await customFetch(`/api/slots/${slotId}/cancel`, { method: "POST" });
        await refreshZones();
        showNotification("Reservation cancelled. Slot is now free.");
      } catch {
        showNotification("Reservation cancelled.");
      } finally {
        setCancelling(false);
      }
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleArrived = () => {
    if (!pendingQrToken) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMapPhase("arrived");
    setQrToken(pendingQrToken);
    setCountdown(300);
    showNotification("You've arrived! Show this QR to the security guard.");
  };

  const timerMins = Math.floor(countdown / 60);
  const timerSecs = countdown % 60;
  const timerDisplay = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;
  const countdownColor = countdown <= 60 ? C.statusOccupied : countdown <= 120 ? C.statusReserved : C.statusFree;
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const headerTitle = mapPhase === "navigating"
    ? "Navigate to Slot"
    : qrToken
    ? "Your QR Code"
    : "Reserve Slot";

  if (confirmed) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, alignItems: "center", justifyContent: "center" }]}>
        <View style={styles.confirmedCard}>
          <View style={styles.confirmedIconWrap}>
            <Feather name="check-circle" size={52} color={C.statusFree} />
          </View>
          <Text style={styles.confirmedTitle}>Entry Confirmed!</Text>
          <Text style={styles.confirmedSub}>Redirecting to active parking…</Text>
          <ActivityIndicator color={C.tint} style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={handleCancel} disabled={cancelling} style={styles.backBtn}>
          {cancelling
            ? <ActivityIndicator size="small" color={C.tint} />
            : <Feather name="arrow-left" size={22} color={C.text} />}
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>

      <View style={styles.slotInfoCard}>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>Slot {slotNumber}</Text>
        </View>
        <Text style={styles.zoneText}>Zone {zoneName}</Text>
        <Text style={styles.reservedLabel}>
          {qrToken ? "RESERVED — AWAITING SECURITY SCAN" : "SELECT THIS SLOT"}
        </Text>
      </View>

      {mapPhase === "navigating" ? (
        <>
          <View style={styles.navInfoBanner}>
            <Feather name="navigation" size={16} color={C.gold} />
            <Text style={styles.navInfoText}>Navigating to Slot {slotNumber} · Zone {zoneName}</Text>
          </View>

          <ParkingMapView zoneName={zoneName} slotNumber={slotNumber} />

          <View style={styles.navStepRow}>
            <View style={styles.navStep}>
              <View style={[styles.navStepDot, navStarted && styles.navStepDotDone]} />
              <Text style={styles.navStepLabel}>Start</Text>
            </View>
            <View style={styles.navStepLine} />
            <View style={styles.navStep}>
              <View style={[styles.navStepDot, styles.navStepDotDest]} />
              <Text style={styles.navStepLabel}>Slot {slotNumber}</Text>
            </View>
          </View>

          <View style={styles.navBtnRow}>
            <Pressable
              onPress={() => {
                setNavStarted(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={({ pressed }) => [
                styles.navStartBtn,
                navStarted && styles.navStartBtnActive,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name={navStarted ? "navigation" : "play"} size={18} color={navStarted ? "#fff" : C.tint} />
              <Text style={[styles.navBtnText, navStarted && { color: "#fff" }]}>
                {navStarted ? "Navigating…" : "Start"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleArrived}
              style={({ pressed }) => [styles.navEndBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.navEndBtnText}>End (Arrived)</Text>
            </Pressable>
          </View>

          <Text style={styles.navHint}>
            Tap "End (Arrived)" once you reach the parking slot to reveal your QR code.
          </Text>

          <Pressable onPress={handleCancel} disabled={cancelling} style={[styles.cancelBtn, { marginTop: 8 }]}>
            {cancelling
              ? <ActivityIndicator size="small" color={C.statusOccupied} />
              : <Text style={styles.cancelBtnText}>Cancel Reservation</Text>}
          </Pressable>
        </>
      ) : !qrToken ? (
        <>
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <Feather name="truck" size={18} color={C.tint} />
              <Text style={styles.inputLabel}>Vehicle Number</Text>
            </View>
            <Text style={styles.inputHint}>Format: AP 31 AC 2044  (2 letters · 2 digits · 2 letters · 4 digits)</Text>
            <View style={[styles.inputRow, vehicleError ? styles.inputRowError : null]}>
              <TextInput
                style={styles.input}
                placeholder="AP 31 AC 2044"
                placeholderTextColor={C.textSecondary}
                value={vehicleNumber}
                onChangeText={handleVehicleChange}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReserve}
                maxLength={13}
              />
              {vehicleNumber.length > 0 && (
                <Pressable onPress={() => { setVehicleNumber(""); setVehicleError(""); }}>
                  <Feather name="x" size={18} color={C.textSecondary} />
                </Pressable>
              )}
            </View>
            {vehicleError ? <Text style={styles.inputError}>{vehicleError}</Text> : null}

            {user?.vehicleNumber && user.vehicleNumber !== vehicleNumber && (
              <Pressable
                onPress={() => { setVehicleNumber(formatPlate(user.vehicleNumber!)); setVehicleError(""); }}
                style={styles.savedVehicleChip}
              >
                <Feather name="truck" size={13} color={C.tint} />
                <Text style={styles.savedVehicleText}>Use saved: {user.vehicleNumber}</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={handleReserve}
            disabled={loading}
            style={({ pressed }) => [styles.reserveBtn, { opacity: pressed || loading ? 0.8 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="grid" size={20} color="#fff" />
                <Text style={styles.reserveBtnText}>Reserve & Generate QR</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Go Back</Text>
          </Pressable>
        </>
      ) : (
        <>
          <View style={styles.qrCard}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrToken}
                size={200}
                color="#1a1a2e"
                backgroundColor="#ffffff"
              />
            </View>
            <View style={styles.qrInfo}>
              <Feather name="info" size={14} color={C.textSecondary} />
              <Text style={styles.qrInfoText}>Show this QR to the security guard at the gate</Text>
            </View>
            <View style={styles.vehicleRow}>
              <Feather name="truck" size={14} color={C.tint} />
              <Text style={styles.vehicleLabel}>Vehicle: <Text style={styles.vehicleNum}>{vehicleNumber.toUpperCase()}</Text></Text>
            </View>
          </View>

          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerTitle}>Expires In</Text>
              <View style={styles.waitingBadge}>
                <ActivityIndicator size="small" color={C.tint} />
                <Text style={styles.waitingText}>Waiting for scan…</Text>
              </View>
            </View>
            <Text style={[styles.timerDisplay, { color: countdownColor }]}>{timerDisplay}</Text>
            <Text style={styles.timerSub}>
              {countdown > 120
                ? "Security must scan within this window"
                : countdown > 60
                ? "Hurry! Less than 2 minutes left"
                : "Almost expired — find security now!"}
            </Text>
          </View>

          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>What happens next?</Text>
            {[
              { icon: "shield", text: "Security guard scans your QR code" },
              { icon: "check-circle", text: "App auto-detects when scan is complete" },
              { icon: "log-out", text: "Tap Exit when you leave to free the slot" },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepIcon}>
                  <Feather name={step.icon as any} size={14} color={C.tint} />
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          <Pressable onPress={handleCancel} disabled={cancelling} style={[styles.cancelBtn, cancelling && { opacity: 0.6 }]}>
            {cancelling
              ? <ActivityIndicator size="small" color={C.statusOccupied} />
              : <Text style={styles.cancelBtnText}>Cancel & Release Slot</Text>}
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  slotInfoCard: {
    backgroundColor: C.tint,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
  },
  slotBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  slotBadgeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  zoneText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.8)",
    marginBottom: 6,
  },
  reservedLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
  },
  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  inputRowError: {
    borderColor: "#D9534F",
    borderWidth: 1.5,
  },
  inputError: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#D9534F",
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: C.text,
    letterSpacing: 1,
  },
  savedVehicleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    backgroundColor: C.tint + "12",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: C.tint + "30",
  },
  savedVehicleText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.tint,
  },
  reserveBtn: {
    backgroundColor: C.tint,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
    marginBottom: 12,
  },
  reserveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  confirmedCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    marginHorizontal: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  confirmedIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: C.statusFreeLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  confirmedTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 8,
  },
  confirmedSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  qrCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  qrInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  qrInfoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    flex: 1,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  vehicleLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  vehicleNum: {
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: 1,
  },
  timerCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 6,
  },
  timerTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  waitingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.tint + "15",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  waitingText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.tint,
  },
  timerDisplay: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginBottom: 6,
  },
  timerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  stepsCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  stepsTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 14,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  stepIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.tint + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.text,
    flex: 1,
  },

  navInfoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.tint + "18",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.tint + "30",
  },
  navInfoText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
    flex: 1,
  },
  navStepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  navStep: {
    alignItems: "center",
    gap: 4,
  },
  navStepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: C.border,
    borderWidth: 2,
    borderColor: C.textSecondary,
  },
  navStepDotDone: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  navStepDotDest: {
    backgroundColor: C.tint,
    borderColor: C.gold,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  navStepLine: {
    flex: 1,
    height: 3,
    backgroundColor: C.border,
    marginHorizontal: 8,
    borderRadius: 2,
  },
  navStepLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  navBtnRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  navStartBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.tint,
    backgroundColor: C.surface,
  },
  navStartBtnActive: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
  },
  navBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  navEndBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.tint,
  },
  navEndBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  navHint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 18,
  },
});
