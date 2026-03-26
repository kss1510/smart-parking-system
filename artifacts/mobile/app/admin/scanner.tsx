import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { customFetch, type VerifyQrResponse } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

export default function AdminScannerScreen() {
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones } = useParking();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyQrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleVerify = async () => {
    const trimmed = token.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await customFetch<VerifyQrResponse>("/api/admin/verify-qr", {
        method: "POST",
        body: JSON.stringify({ token: trimmed }),
      });
      setResult(data);
      showNotification(`Entry confirmed: ${data.vehicleNumber} → Slot ${data.slotNumber}`);
      await refreshZones();
    } catch (e: any) {
      const msg = e?.message ?? "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setToken("");
    setResult(null);
    setError(null);
  };

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
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>QR Verification</Text>
          <Text style={styles.headerSub}>Security Guard Access</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={12} color={C.warning} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Feather name="camera" size={32} color={C.tint} />
        </View>
        <Text style={styles.heroTitle}>Verify Student Entry</Text>
        <Text style={styles.heroSub}>
          Paste the QR token from the student's phone or scan using a QR scanner app and paste the code below
        </Text>
      </View>

      {!result ? (
        <>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>QR Token</Text>
            <Text style={styles.inputHint}>Paste the code from the student's QR screen</Text>
            <View style={styles.inputRow}>
              <Feather name="hash" size={16} color={C.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="e.g. a3f1c2d4-8b9e-4f2a-..."
                placeholderTextColor={C.textSecondary}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleVerify}
                multiline={false}
              />
              {token.length > 0 && (
                <Pressable onPress={() => setToken("")}>
                  <Feather name="x" size={16} color={C.textSecondary} />
                </Pressable>
              )}
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleVerify}
            disabled={loading || !token.trim()}
            style={({ pressed }) => [
              styles.verifyBtn,
              { opacity: pressed || loading || !token.trim() ? 0.7 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.verifyBtnText}>Verify & Allow Entry</Text>
              </>
            )}
          </Pressable>
        </>
      ) : (
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={40} color={C.statusFree} />
          </View>
          <Text style={styles.successTitle}>Entry Confirmed!</Text>
          <Text style={styles.successSub}>Vehicle successfully checked in</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Feather name="truck" size={14} color={C.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Vehicle</Text>
                <Text style={styles.detailValue}>{result.vehicleNumber}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Feather name="map-pin" size={14} color={C.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Slot Assigned</Text>
                <Text style={styles.detailValue}>Zone {result.zoneName} · Slot {result.slotNumber}</Text>
              </View>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Feather name="clock" size={14} color={C.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>Entry Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(result.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            </View>
          </View>

          <Pressable onPress={handleReset} style={styles.scanNextBtn}>
            <Feather name="refresh-cw" size={16} color={C.tint} />
            <Text style={styles.scanNextText}>Scan Next Vehicle</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works</Text>
        {[
          "Student reserves a slot and receives a QR code",
          "Student shows QR on their phone at the gate",
          "Paste or scan the QR token above to verify",
          "If expired (>5 min), the system auto-rejects",
        ].map((line, i) => (
          <View key={i} style={styles.infoRow}>
            <Text style={styles.infoBullet}>{i + 1}.</Text>
            <Text style={styles.infoText}>{line}</Text>
          </View>
        ))}
      </View>
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
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  headerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.warningLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  adminBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.warning,
  },
  heroCard: {
    backgroundColor: C.tint + "10",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.tint + "20",
    marginBottom: 20,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 20,
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
  inputLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 4,
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
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.dangerLight,
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.danger,
    flex: 1,
  },
  verifyBtn: {
    backgroundColor: C.tint,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
    marginBottom: 20,
  },
  verifyBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  successCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.statusFree + "40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.statusFree + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 4,
  },
  successSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 24,
  },
  detailGrid: {
    width: "100%",
    backgroundColor: C.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  detailDivider: {
    height: 1,
    backgroundColor: C.borderLight,
    marginVertical: 8,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.tint + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  scanNextBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: C.tint,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scanNextText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
  },
  infoCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 18,
  },
  infoTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.tint,
    width: 18,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
});
