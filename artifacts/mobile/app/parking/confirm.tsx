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
import Colors from "@/constants/colors";
import { confirmParking } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

export default function ConfirmParkingScreen() {
  const { slotId, slotNumber, zoneName } = useLocalSearchParams<{
    slotId: string;
    slotNumber: string;
    zoneName: string;
  }>();
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones, refreshActiveSession, selectedVehicle, setSelectedVehicle } = useParking();

  const [vehicleNumber, setVehicleNumber] = useState(selectedVehicle ?? "");
  const [countdown, setCountdown] = useState(30);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      showNotification("Reservation expired. Slot released.");
      router.back();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleConfirm = async () => {
    if (!vehicleNumber.trim()) {
      Alert.alert("Vehicle Number Required", "Enter your vehicle number to confirm parking.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      await confirmParking(parseInt(slotId, 10), { vehicleNumber: vehicleNumber.trim().toUpperCase() });
      setSelectedVehicle(vehicleNumber.trim().toUpperCase());
      showNotification(`Parked! Vehicle ${vehicleNumber.toUpperCase()} · Zone ${zoneName} · Slot ${slotNumber}`);
      await refreshZones();
      await refreshActiveSession(vehicleNumber.trim().toUpperCase());
      router.replace("/parking/active");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to confirm parking.";
      if (msg.includes("expired")) {
        Alert.alert("Reservation Expired", "Your 30-second reservation has expired. Please select a slot again.");
        router.back();
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const countdownColor = countdown <= 10 ? C.statusOccupied : countdown <= 20 ? C.statusReserved : C.statusFree;
  const circumference = 2 * Math.PI * 28;
  const progress = countdown / 30;

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: C.background }]}
      contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Confirm Parking</Text>
      </View>

      <View style={styles.slotInfoCard}>
        <View style={styles.slotBadge}>
          <Text style={styles.slotBadgeText}>Slot {slotNumber}</Text>
        </View>
        <Text style={styles.zoneText}>Zone {zoneName}</Text>
        <Text style={styles.reservedLabel}>RESERVED FOR YOU</Text>
      </View>

      <View style={styles.timerCard}>
        <Text style={styles.timerTitle}>Reservation Expires In</Text>
        <View style={styles.timerCircle}>
          <Text style={[styles.timerNum, { color: countdownColor }]}>{countdown}</Text>
          <Text style={styles.timerSec}>seconds</Text>
        </View>
        <Text style={styles.timerHint}>Confirm your parking before the timer runs out</Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Vehicle Number</Text>
        <Text style={styles.inputHint}>Enter your license plate or simulate QR scan</Text>
        <View style={styles.inputRow}>
          <Feather name="truck" size={18} color={C.textSecondary} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="e.g. ABC-1234"
            placeholderTextColor={C.textSecondary}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
          />
          {vehicleNumber.length > 0 && (
            <Pressable onPress={() => setVehicleNumber("")}>
              <Feather name="x" size={18} color={C.textSecondary} />
            </Pressable>
          )}
        </View>

        <View style={styles.quickVehicles}>
          {["ABC-1234", "XY-5678", "KL-9900"].map(v => (
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
        onPress={handleConfirm}
        disabled={loading || countdown === 0}
        style={({ pressed }) => [
          styles.confirmBtn,
          { opacity: pressed || loading || countdown === 0 ? 0.8 : 1 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.confirmBtnText}>Confirm Parking</Text>
          </>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
        <Text style={styles.cancelBtnText}>Cancel & Release Slot</Text>
      </Pressable>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  slotBadgeText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
  },
  zoneText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 8,
  },
  reservedLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
  },
  timerCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  timerTitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
    marginBottom: 12,
  },
  timerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  timerNum: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
  },
  timerSec: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  timerHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    letterSpacing: 1,
  },
  quickVehicles: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  quickChip: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: C.background,
  },
  quickChipActive: {
    borderColor: C.tint,
    backgroundColor: C.infoLight,
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
  quickChipTextActive: {
    color: C.tint,
  },
  confirmBtn: {
    backgroundColor: C.statusFree,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 12,
    shadowColor: C.statusFree,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
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
});
