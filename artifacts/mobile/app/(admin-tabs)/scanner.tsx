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
      <View style={[styles.menuIcon, { backgroundColor: C.tint + "12" }]}>
        <Feather name={icon as any} size={15} color={C.tint} />
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
      showNotification(`Entry confirmed: ${data.vehicleNumber}`);
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

  // Success result screen
  if (result) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}>
          <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
            <View style={styles.heroTop}>
              <View style={styles.heroIconWrap}>
                <Feather name="camera" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>QR Scanner</Text>
                <Text style={styles.heroSub}>Security Guard Access</Text>
              </View>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={52} color={C.statusFree} />
            </View>
            <Text style={styles.successTitle}>Entry Confirmed!</Text>
            <Text style={styles.successSub}>Vehicle successfully checked in</Text>

            <Text style={styles.sectionLabel}>Entry Details</Text>
            <View style={styles.sectionCard}>
              <DetailRow icon="truck" label="Vehicle Number" value={result.vehicleNumber} />
              <View style={styles.divider} />
              <DetailRow icon="map-pin" label="Slot Assigned" value={`Zone ${result.zoneName} · Slot ${result.slotNumber}`} />
              <View style={styles.divider} />
              <DetailRow icon="clock" label="Entry Time" value={new Date(result.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
              {(result as any).userName && (
                <>
                  <View style={styles.divider} />
                  <DetailRow icon="user" label="Student Name" value={(result as any).userName} />
                </>
              )}
              {(result as any).registrationId && (
                <>
                  <View style={styles.divider} />
                  <DetailRow icon="credit-card" label="Registration ID" value={(result as any).registrationId} />
                </>
              )}
            </View>

            <Pressable onPress={handleReset} style={styles.scanNextBtn}>
              <Feather name="refresh-cw" size={18} color="#fff" />
              <Text style={styles.scanNextBtnText}>Scan Next Vehicle</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconWrap}>
            <Feather name="camera" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Scan Student QR</Text>
            <Text style={styles.heroSub}>Point camera at student's QR code</Text>
          </View>
        </View>

        {/* Mode toggle in header */}
        <View style={styles.modeToggle}>
          <Pressable onPress={() => { setMode("camera"); setError(null); }} style={[styles.modeBtn, mode === "camera" && styles.modeBtnActive]}>
            <Feather name="camera" size={14} color={mode === "camera" ? "#fff" : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.modeBtnText, mode === "camera" && styles.modeBtnTextActive]}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => { setMode("manual"); setError(null); }} style={[styles.modeBtn, mode === "manual" && styles.modeBtnActive]}>
            <Feather name="edit-3" size={14} color={mode === "manual" ? "#fff" : "rgba(255,255,255,0.6)"} />
            <Text style={[styles.modeBtnText, mode === "manual" && styles.modeBtnTextActive]}>Manual</Text>
          </Pressable>
        </View>
      </View>

      {mode === "camera" ? (
        <View style={styles.cameraContainer}>
          {!permission?.granted ? (
            <View style={styles.permissionBox}>
              <Feather name="camera-off" size={40} color={C.textSecondary} />
              <Text style={styles.permissionTitle}>Camera Access Needed</Text>
              <Text style={styles.permissionSub}>Grant camera permission to scan QR codes</Text>
              <Pressable onPress={requestPermission} style={styles.permissionBtn}>
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
        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 100 }]} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>QR Token</Text>
          <View style={styles.sectionCard}>
            <View style={styles.inputRow}>
              <View style={[styles.menuIcon, { backgroundColor: C.tint + "12" }]}>
                <Feather name="hash" size={17} color={C.tint} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Paste token from student's QR screen..."
                placeholderTextColor={C.textSecondary}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => handleVerify()}
              />
              {token.length > 0 && (
                <Pressable onPress={() => setToken("")} style={{ padding: 4 }}>
                  <Feather name="x" size={16} color={C.textSecondary} />
                </Pressable>
              )}
            </View>
            {error && (
              <>
                <View style={styles.divider} />
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={15} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              </>
            )}
          </View>

          <Pressable
            onPress={() => handleVerify()}
            disabled={loading || !token.trim()}
            style={({ pressed }) => [styles.verifyBtn, { opacity: pressed || loading || !token.trim() ? 0.7 : 1 }]}
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

          <View style={styles.hintCard}>
            <Feather name="info" size={15} color={C.tint} />
            <Text style={styles.hintText}>
              The student shows their QR token on the Parking tab. Paste or type it here to confirm their entry and increment their priority score by +1.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: {},
  body: { paddingHorizontal: 18, paddingTop: 16 },
  heroHeader: { backgroundColor: C.tint, paddingHorizontal: 20, paddingBottom: 20 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.62)", marginTop: 2 },
  modeToggle: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 12, padding: 3, gap: 3 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  modeBtnActive: { backgroundColor: "rgba(255,255,255,0.2)" },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.6)" },
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
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 },
  sectionCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 18, borderWidth: 1, borderColor: C.border, shadowColor: "#004D36", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  input: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: C.text },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 14 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.danger, flex: 1 },
  verifyBtn: { backgroundColor: C.tint, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10, marginBottom: 16 },
  verifyBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  hintCard: { flexDirection: "row", gap: 10, backgroundColor: C.tint + "08", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.tint + "20" },
  hintText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  successIcon: { alignItems: "center", paddingVertical: 28 },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.text, textAlign: "center", marginBottom: 4 },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", color: C.textSecondary, textAlign: "center", marginBottom: 20 },
  detailRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 2 },
  scanNextBtn: { backgroundColor: C.tint, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10 },
  scanNextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
