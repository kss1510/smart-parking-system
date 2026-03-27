import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, Platform, ScrollView, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions } from "expo-camera";
import Colors from "@/constants/colors";
import { customFetch, type VerifyQrResponse } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;
const FRAME_SIZE = 220;

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>
        <Feather name={icon as any} size={14} color={C.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AdminScannerScreen() {
  const insets = useSafeAreaInsets();
  const { showNotification, refreshZones } = useParking();
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"camera" | "manual">(Platform.OS === "web" ? "manual" : "camera");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyQrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  useEffect(() => {
    if (mode === "camera" && Platform.OS !== "web" && !permission?.granted) {
      requestPermission();
    }
  }, [mode]);

  const handleVerify = async (tok?: string) => {
    const trimmed = (tok ?? token).trim();
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
      setError(e?.message ?? "Verification failed.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setToken(data);
    handleVerify(data);
  };

  const handleReset = () => {
    setToken(""); setResult(null); setError(null); setScanned(false);
  };

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (!res.granted) {
      Alert.alert("Camera Required", "Please enable camera access in your device settings.");
    }
  };

  if (result) {
    return (
      <ScrollView style={[styles.screen, { backgroundColor: C.background }]}
        contentContainerStyle={[styles.container, { paddingTop: topPad + 16, paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Feather name="camera" size={18} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>QR Scanner</Text>
            <Text style={styles.headerSub}>Security Guard Access</Text>
          </View>
          <View style={styles.adminBadge}>
            <Feather name="shield" size={12} color={C.gold} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Feather name="check-circle" size={48} color={C.statusFree} />
          </View>
          <Text style={styles.successTitle}>Entry Confirmed!</Text>
          <Text style={styles.successSub}>Vehicle successfully checked in</Text>
          <View style={styles.detailGrid}>
            <DetailRow icon="truck" label="Vehicle" value={result.vehicleNumber} />
            <View style={styles.detailDivider} />
            <DetailRow icon="map-pin" label="Slot Assigned" value={`Zone ${result.zoneName} · Slot ${result.slotNumber}`} />
            <View style={styles.detailDivider} />
            <DetailRow icon="clock" label="Entry Time" value={new Date(result.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
            {(result as any).userName && (<><View style={styles.detailDivider} /><DetailRow icon="user" label="Student" value={(result as any).userName} /></>)}
            {(result as any).registrationId && (<><View style={styles.detailDivider} /><DetailRow icon="credit-card" label="Reg. ID" value={(result as any).registrationId} /></>)}
          </View>
          <Pressable onPress={handleReset} style={styles.scanNextBtn}>
            <Feather name="refresh-cw" size={16} color={C.tint} />
            <Text style={styles.scanNextText}>Scan Next Vehicle</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, paddingHorizontal: 20 }]}>
        <View style={styles.headerIcon}><Feather name="camera" size={18} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Scan Student QR</Text>
          <Text style={styles.headerSub}>Point camera at student's QR code</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={12} color={C.gold} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <View style={styles.modeToggle}>
        <Pressable onPress={() => { setMode("camera"); setError(null); }} style={[styles.modeBtn, mode === "camera" && styles.modeBtnActive]}>
          <Feather name="camera" size={14} color={mode === "camera" ? "#fff" : C.textSecondary} />
          <Text style={[styles.modeBtnText, mode === "camera" && styles.modeBtnTextActive]}>Camera</Text>
        </Pressable>
        <Pressable onPress={() => { setMode("manual"); setError(null); }} style={[styles.modeBtn, mode === "manual" && styles.modeBtnActive]}>
          <Feather name="edit-3" size={14} color={mode === "manual" ? "#fff" : C.textSecondary} />
          <Text style={[styles.modeBtnText, mode === "manual" && styles.modeBtnTextActive]}>Manual</Text>
        </Pressable>
      </View>

      {mode === "camera" ? (
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Feather name="camera-off" size={40} color={C.textSecondary} />
              <Text style={styles.permissionTitle}>Camera Access Needed</Text>
              <Text style={styles.permissionSub}>Grant camera permission to scan QR codes</Text>
              <Pressable onPress={handleRequestPermission} style={styles.permissionBtn}>
                <Text style={styles.permissionBtnText}>Enable Camera</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFillObject} facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
              <View style={styles.scanOverlay}>
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <Text style={styles.scanHint}>Align QR code within the frame</Text>
              </View>
              {loading && (
                <View style={styles.scanLoadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.scanLoadingText}>Verifying...</Text>
                </View>
              )}
              {error && (
                <View style={styles.scanErrorOverlay}>
                  <Feather name="alert-circle" size={20} color="#fff" />
                  <Text style={styles.scanErrorText}>{error}</Text>
                  <Pressable onPress={handleReset} style={styles.scanRetryBtn}>
                    <Text style={styles.scanRetryText}>Try Again</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.manualContainer, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.heroCard}>
            <View style={styles.heroIcon}><Feather name="hash" size={28} color={C.tint} /></View>
            <Text style={styles.heroTitle}>Enter QR Token</Text>
            <Text style={styles.heroSub}>Paste the token shown on the student's QR screen</Text>
          </View>
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>QR Token</Text>
            <View style={styles.inputRow}>
              <Feather name="hash" size={16} color={C.textSecondary} />
              <TextInput
                style={styles.input} placeholder="e.g. a3f1c2d4-8b9e-4f2a-..."
                placeholderTextColor={C.textSecondary} value={token}
                onChangeText={setToken} autoCapitalize="none" autoCorrect={false}
                returnKeyType="done" onSubmitEditing={() => handleVerify()}
              />
              {token.length > 0 && <Pressable onPress={() => setToken("")}><Feather name="x" size={16} color={C.textSecondary} /></Pressable>}
            </View>
            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={() => handleVerify()} disabled={loading || !token.trim()}
            style={({ pressed }) => [styles.verifyBtn, { opacity: pressed || loading || !token.trim() ? 0.7 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <><Feather name="check-circle" size={20} color="#fff" /><Text style={styles.verifyBtnText}>Verify & Allow Entry</Text></>
            )}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingBottom: 18, backgroundColor: C.tint,
  },
  headerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  modeToggle: { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, backgroundColor: C.surface, borderRadius: 12, padding: 4, gap: 4 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  modeBtnActive: { backgroundColor: C.tint },
  modeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.textSecondary },
  modeBtnTextActive: { color: "#fff" },
  cameraContainer: { flex: 1, position: "relative" },
  permissionBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  permissionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginTop: 8 },
  permissionSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center" },
  permissionBtn: { backgroundColor: C.tint, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  permissionBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)" },
  scanFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: "relative" },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE, borderColor: "#fff", borderWidth: CORNER_THICKNESS },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { marginTop: 24, color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  scanLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", gap: 12 },
  scanLoadingText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scanErrorOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(200,0,0,0.85)", padding: 24, alignItems: "center", gap: 8 },
  scanErrorText: { color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  scanRetryBtn: { borderWidth: 1.5, borderColor: "#fff", borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  scanRetryText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  manualContainer: { paddingHorizontal: 20, paddingTop: 8 },
  heroCard: { backgroundColor: C.tint + "10", borderRadius: 20, padding: 24, alignItems: "center", borderWidth: 1, borderColor: C.tint + "20", marginBottom: 20 },
  heroIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: C.tint + "20", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  heroTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 6 },
  heroSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", lineHeight: 20 },
  inputCard: { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  inputLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text, marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: C.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border, gap: 10 },
  input: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.dangerLight, borderRadius: 10, padding: 12, marginTop: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.danger, flex: 1 },
  verifyBtn: { backgroundColor: C.tint, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10, marginBottom: 20 },
  verifyBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  successCard: { backgroundColor: C.surface, borderRadius: 20, padding: 28, alignItems: "center", margin: 20, borderWidth: 1, borderColor: C.statusFree + "40", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.statusFree + "15", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 4 },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, marginBottom: 24 },
  detailGrid: { width: "100%", backgroundColor: C.background, borderRadius: 14, padding: 16, marginBottom: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  detailDivider: { height: 1, backgroundColor: C.borderLight, marginVertical: 8 },
  detailIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.tint + "15", alignItems: "center", justifyContent: "center" },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.text },
  scanNextBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: C.tint, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  scanNextText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.tint },
});
