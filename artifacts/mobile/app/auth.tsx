import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

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

type Role = "none" | "student" | "admin";

function InputField({
  icon, label, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, rightEl,
}: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Feather name={icon} size={17} color={C.tint} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor="#A0B0AA"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={false}
        />
        {rightEl}
      </View>
    </View>
  );
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<Role>("none");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleError, setVehicleError] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter email and password.");
      return;
    }
    if (role === "admin" && !adminCode.trim()) {
      Alert.alert("Admin Code Required", "Enter the admin secret code.");
      return;
    }
    if (!isLogin && vehicleNumber.trim() && !PLATE_REGEX.test(vehicleNumber)) {
      setVehicleError("Format must be: AP 31 AC 2044");
      return;
    }
    setVehicleError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, {
          name: name.trim() || undefined,
          registrationId: registrationId.trim() || undefined,
          vehicleNumber: vehicleNumber.trim() || undefined,
          adminCode: role === "admin" ? adminCode.trim() : undefined,
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (r: Role) => {
    setRole(r);
    setEmail(""); setPassword(""); setName(""); setRegistrationId("");
    setVehicleNumber(""); setVehicleError(""); setAdminCode(""); setIsLogin(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setName(""); setRegistrationId(""); setVehicleNumber(""); setVehicleError(""); setAdminCode("");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  if (role === "none") {
    return (
      <View style={styles.landing}>
        <View style={[styles.heroSection, { paddingTop: topPad + 40 }]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>GITAM University</Text>
          </View>
          <View style={styles.logoRow}>
            <View style={styles.logoCircle}>
              <Feather name="map-pin" size={28} color={C.gold} />
            </View>
            <View>
              <Text style={styles.heroTitle}>CampusPark</Text>
              <Text style={styles.heroSubtitle}>Smart Parking Management System</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>3</Text>
              <Text style={styles.heroStatLbl}>Zones</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>30</Text>
              <Text style={styles.heroStatLbl}>Slots</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatNum}>24/7</Text>
              <Text style={styles.heroStatLbl}>Live</Text>
            </View>
          </View>
        </View>

        <View style={[styles.roleSection, { paddingBottom: insets.bottom + 32 }]}>
          <Text style={styles.rolePrompt}>Sign in as</Text>

          <Pressable
            onPress={() => selectRole("student")}
            style={({ pressed }) => [styles.roleCard, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={[styles.roleCardLeft, { backgroundColor: C.tint }]}>
              <Feather name="user" size={26} color="#fff" />
            </View>
            <View style={styles.roleCardBody}>
              <Text style={styles.roleCardTitle}>Student / Faculty</Text>
              <Text style={styles.roleCardSub}>Reserve slots, track history & earn rewards</Text>
            </View>
            <Feather name="chevron-right" size={20} color={C.tint} />
          </Pressable>

          <Pressable
            onPress={() => selectRole("admin")}
            style={({ pressed }) => [styles.roleCard, styles.roleCardAdmin, { opacity: pressed ? 0.92 : 1 }]}
          >
            <View style={[styles.roleCardLeft, { backgroundColor: C.tint + "CC" }]}>
              <Feather name="shield" size={26} color={C.gold} />
            </View>
            <View style={styles.roleCardBody}>
              <Text style={[styles.roleCardTitle, { color: C.tint }]}>Admin / Security</Text>
              <Text style={styles.roleCardSub}>Scan QR codes, manage & monitor parking</Text>
            </View>
            <Feather name="chevron-right" size={20} color={C.tint} />
          </Pressable>

          <View style={styles.footerHint}>
            <Feather name="lock" size={12} color={C.textSecondary} />
            <Text style={styles.footerHintText}>Secured by GITAM IT Department</Text>
          </View>
        </View>
      </View>
    );
  }

  const isAdmin = role === "admin";
  const accentColor = C.tint;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.formContainer, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.formHero, { paddingTop: topPad + 32 }]}>
          <Pressable onPress={() => setRole("none")} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.formLogoRow}>
            <View style={styles.formLogoCircle}>
              <Feather name={isAdmin ? "shield" : "map-pin"} size={22} color={C.gold} />
            </View>
            <Text style={styles.formLogoText}>CampusPark</Text>
          </View>
          <Text style={styles.formHeroTitle}>
            {isLogin
              ? isAdmin ? "Admin Sign In" : "Welcome Back"
              : isAdmin ? "Admin Registration" : "Create Account"}
          </Text>
          <Text style={styles.formHeroSub}>
            {isLogin
              ? isAdmin ? "Sign in to access the admin dashboard" : "Sign in to manage your parking"
              : isAdmin ? "Register with your admin secret code" : "Join GITAM CampusPark today"}
          </Text>
        </View>

        <View style={styles.formCard}>
          {!isLogin && (
            <InputField
              icon="user" label="Full Name" placeholder={isAdmin ? "Admin Name" : "John Smith"}
              value={name} onChangeText={setName} autoCapitalize="words"
            />
          )}

          <InputField
            icon="mail" label="Email Address" placeholder="you@gitam.edu"
            value={email} onChangeText={setEmail} keyboardType="email-address"
          />

          {!isLogin && !isAdmin && (
            <InputField
              icon="credit-card" label="Registration ID" placeholder="21311A0001 (optional)"
              value={registrationId} onChangeText={setRegistrationId}
            />
          )}

          {!isLogin && !isAdmin && (
            <View>
              <InputField
                icon="truck" label="Vehicle Number" placeholder="AP 31 AC 2044 (optional)"
                value={vehicleNumber}
                onChangeText={(v: string) => {
                  const formatted = formatPlate(v);
                  setVehicleNumber(formatted);
                  if (formatted.length > 0 && !PLATE_REGEX.test(formatted)) {
                    setVehicleError("Format: AP 31 AC 2044");
                  } else {
                    setVehicleError("");
                  }
                }}
                autoCapitalize="characters"
              />
              {vehicleError ? (
                <Text style={styles.plateError}>{vehicleError}</Text>
              ) : vehicleNumber.length > 0 ? (
                <Text style={styles.plateHint}>Format: 2 letters · 2 digits · 2 letters · 4 digits</Text>
              ) : null}
            </View>
          )}

          <InputField
            icon="lock" label="Password" placeholder="••••••••"
            value={password} onChangeText={setPassword} secureTextEntry={!showPass}
            rightEl={
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? "eye-off" : "eye"} size={17} color={C.textSecondary} />
              </Pressable>
            }
          />

          {isAdmin && (
            <InputField
              icon="shield" label="Admin Secret Code" placeholder="Enter admin code"
              value={adminCode} onChangeText={setAdminCode}
            />
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: accentColor, opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name={isLogin ? "log-in" : "user-plus"} size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{isLogin ? "Sign In" : "Create Account"}</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={switchMode} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: accentColor, fontFamily: "Inter_700Bold" }}>
                {isLogin ? "Register" : "Sign In"}
              </Text>
            </Text>
          </Pressable>

          {!isLogin && isAdmin && (
            <View style={styles.adminCodeHint}>
              <Feather name="info" size={13} color={C.gold} />
              <Text style={styles.adminCodeHintText}>
                An admin secret code is required to create an admin account.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  landing: {
    flex: 1,
    backgroundColor: C.tint,
  },
  heroSection: {
    flex: 1,
    backgroundColor: C.tint,
    paddingHorizontal: 28,
    paddingBottom: 40,
    justifyContent: "center",
  },
  heroBadge: {
    backgroundColor: "rgba(201,160,42,0.22)",
    borderWidth: 1,
    borderColor: C.gold + "55",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 24,
  },
  heroBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.gold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: C.gold + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
    marginTop: 3,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 18,
  },
  heroStat: { flex: 1, alignItems: "center" },
  heroStatNum: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.gold,
  },
  heroStatLbl: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
    marginTop: 3,
  },
  heroStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 4,
  },
  roleSection: {
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  rolePrompt: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
    paddingRight: 16,
    shadowColor: "#004D36",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  roleCardAdmin: {
    borderColor: C.tint + "30",
  },
  roleCardLeft: {
    width: 64,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardBody: { flex: 1, paddingVertical: 16 },
  roleCardTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 3,
  },
  roleCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    lineHeight: 17,
  },
  footerHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
  },
  footerHintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  formContainer: {
    flexGrow: 1,
  },
  formHero: {
    backgroundColor: C.tint,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  formLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  formLogoCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: C.gold + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  formLogoText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  formHeroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 6,
  },
  formHeroSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.65)",
  },
  formCard: {
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    flex: 1,
    marginTop: -10,
  },
  inputGroup: { marginBottom: 14 },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    marginBottom: 7,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  eyeBtn: { padding: 4 },
  plateError: {
    marginTop: 5,
    marginLeft: 2,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#D9534F",
  },
  plateHint: {
    marginTop: 5,
    marginLeft: 2,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  primaryBtn: {
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  switchBtn: {
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  adminCodeHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FDF3D9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C9A02A44",
    padding: 12,
    marginTop: 10,
  },
  adminCodeHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7A6010",
    lineHeight: 17,
  },
});
