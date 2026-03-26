import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
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

const C = Colors.light;

export default function ConfirmParkingScreen() {
  const { slotId, slotNumber, zoneName } = useLocalSearchParams<{
    slotId: string;
    slotNumber: string;
    zoneName: string;
  }>();
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones, selectedVehicle, setSelectedVehicle } = useParking();
  const { user } = useAuth();

  const [vehicleNumber, setVehicleNumber] = useState(selectedVehicle ?? "");
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(300);

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

  const handleReserve = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert("Vehicle Number Required", "Enter your vehicle number to reserve this slot.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      const result = await customFetch<ReserveSlotResponse>(`/api/slots/${slotId}/reserve`, {
        method: "POST",
        body: JSON.stringify({ vehicleNumber: vehicleNumber.trim().toUpperCase(), userId: user?.userId }),
      });
      setSelectedVehicle(vehicleNumber.trim().toUpperCase());
      setQrToken(result.qrToken);
      setCountdown(300);
      await refreshZones();
      showNotification(`Slot ${slotNumber} reserved! Show QR to security.`);
    } catch (e: any) {
      const msg = e?.message ?? "Failed to reserve slot.";
      Alert.alert("Reservation Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (qrToken) {
      Alert.alert(
        "Cancel Reservation",
        "Are you sure you want to cancel? Your reserved slot will be released.",
        [
          { text: "Keep Reservation", style: "cancel" },
          {
            text: "Cancel & Release",
            style: "destructive",
            onPress: () => {
              showNotification("Reservation cancelled.");
              router.back();
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const timerMins = Math.floor(countdown / 60);
  const timerSecs = countdown % 60;
  const timerDisplay = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;
  const countdownColor = countdown <= 60 ? C.statusOccupied : countdown <= 120 ? C.statusReserved : C.statusFree;
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{qrToken ? "Your QR Code" : "Reserve Slot"}</Text>
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

      {!qrToken ? (
        <>
          <View style={styles.inputCard}>
            <View style={styles.inputCardHeader}>
              <Feather name="truck" size={18} color={C.tint} />
              <Text style={styles.inputLabel}>Vehicle Number</Text>
            </View>
            <Text style={styles.inputHint}>Enter your license plate to generate a QR entry pass</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="e.g. TN-01-AB-1234"
                placeholderTextColor={C.textSecondary}
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleReserve}
              />
              {vehicleNumber.length > 0 && (
                <Pressable onPress={() => setVehicleNumber("")}>
                  <Feather name="x" size={18} color={C.textSecondary} />
                </Pressable>
              )}
            </View>

            <View style={styles.quickVehicles}>
              {["TN01AB1234", "KA02CD5678", "MH03EF9900"].map(v => (
                <Pressable
                  key={v}
                  onPress={() => setVehicleNumber(v)}
                  style={[styles.quickChip, vehicleNumber === v && styles.quickChipActive]}
                >
                  <Text style={[styles.quickChipText, vehicleNumber === v && styles.quickChipTextActive]}>{v}</Text>
                </Pressable>
              ))}
            </View>
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
            <Text style={styles.timerTitle}>Expires In</Text>
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
              { icon: "check-circle", text: "Slot status changes to Occupied" },
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

          <Pressable onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={styles.cancelBtnText}>Cancel & Release Slot</Text>
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
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: C.text,
    letterSpacing: 1,
  },
  quickVehicles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickChipActive: {
    backgroundColor: C.tint + "20",
    borderColor: C.tint,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  quickChipTextActive: {
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
  timerTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
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
});
