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

type Role = "none" | "student" | "admin";

function InputField({
  icon, label, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, rightEl,
}: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Feather name={icon} size={18} color={C.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={placeholder}
          placeholderTextColor={C.textSecondary}
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
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter email and password.");
      return;
    }
    if (role === "admin" && !adminCode.trim()) {
      Alert.alert("Admin Code Required", "Enter the admin secret code to access the admin panel.");
      return;
    }
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
    setVehicleNumber(""); setAdminCode(""); setIsLogin(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setName(""); setRegistrationId(""); setVehicleNumber(""); setAdminCode("");
  };

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 40);

  if (role === "none") {
    return (
      <View style={[styles.landing, { paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="map-pin" size={40} color="#fff" />
          </View>
          <Text style={styles.appTitle}>CampusPark</Text>
          <Text style={styles.appSubtitle}>Smart Parking Management</Text>
        </View>

        <Text style={styles.rolePrompt}>Sign in as</Text>

        <View style={styles.roleCards}>
          <Pressable
            onPress={() => selectRole("student")}
            style={({ pressed }) => [styles.roleCard, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: C.tint + "18" }]}>
              <Feather name="user" size={32} color={C.tint} />
            </View>
            <Text style={styles.roleCardTitle}>Student / Faculty</Text>
            <Text style={styles.roleCardSub}>Reserve parking slots, view history & earn rewards</Text>
            <View style={[styles.roleArrow, { backgroundColor: C.tint }]}>
              <Feather name="arrow-right" size={16} color="#fff" />
            </View>
          </Pressable>

          <Pressable
            onPress={() => selectRole("admin")}
            style={({ pressed }) => [styles.roleCard, styles.roleCardAdmin, { opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={[styles.roleIconWrap, { backgroundColor: "#8B5CF620" }]}>
              <Feather name="shield" size={32} color="#8B5CF6" />
            </View>
            <Text style={[styles.roleCardTitle, { color: "#8B5CF6" }]}>Admin / Security</Text>
            <Text style={styles.roleCardSub}>Scan QR codes, manage slots & monitor parking activity</Text>
            <View style={[styles.roleArrow, { backgroundColor: "#8B5CF6" }]}>
              <Feather name="arrow-right" size={16} color="#fff" />
            </View>
          </Pressable>
        </View>

        <View style={styles.demoHint}>
          <Feather name="info" size={14} color={C.textSecondary} />
          <Text style={styles.demoText}>Admin code: ADMIN123 for security staff registration</Text>
        </View>
      </View>
    );
  }

  const isAdmin = role === "admin";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: topPad, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formHeader}>
          <Pressable onPress={() => setRole("none")} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={C.text} />
          </Pressable>
          <View style={[styles.rolePill, { backgroundColor: isAdmin ? "#8B5CF620" : C.tint + "18" }]}>
            <Feather name={isAdmin ? "shield" : "user"} size={14} color={isAdmin ? "#8B5CF6" : C.tint} />
            <Text style={[styles.rolePillText, { color: isAdmin ? "#8B5CF6" : C.tint }]}>
              {isAdmin ? "Admin Panel" : "Student Panel"}
            </Text>
          </View>
        </View>

        <View style={styles.logoSmall}>
          <View style={[styles.logoCircleSmall, { backgroundColor: isAdmin ? "#8B5CF6" : C.tint }]}>
            <Feather name={isAdmin ? "shield" : "map-pin"} size={24} color="#fff" />
          </View>
          <Text style={styles.appTitleSmall}>CampusPark</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isLogin ? (isAdmin ? "Admin Sign In" : "Welcome Back") : (isAdmin ? "Admin Registration" : "Create Account")}
          </Text>
          <Text style={styles.cardSub}>
            {isLogin
              ? (isAdmin ? "Sign in to access the admin dashboard" : "Sign in to manage parking")
              : (isAdmin ? "Register with your admin secret code" : "Get started with CampusPark")}
          </Text>

          {!isLogin && !isAdmin && (
            <InputField
              icon="user" label="Full Name" placeholder="John Smith"
              value={name} onChangeText={setName} autoCapitalize="words"
            />
          )}

          <InputField
            icon="mail" label="Email" placeholder="you@university.edu"
            value={email} onChangeText={setEmail} keyboardType="email-address"
          />

          {!isLogin && !isAdmin && (
            <InputField
              icon="credit-card" label="Registration ID" placeholder="REG2024001 (optional)"
              value={registrationId} onChangeText={setRegistrationId}
            />
          )}

          {!isLogin && !isAdmin && (
            <InputField
              icon="truck" label="Vehicle Number" placeholder="KA05AB1234 (optional)"
              value={vehicleNumber} onChangeText={(v: string) => setVehicleNumber(v.toUpperCase())}
            />
          )}

          <InputField
            icon="lock" label="Password" placeholder="••••••••"
            value={password} onChangeText={setPassword} secureTextEntry={!showPass}
            rightEl={
              <Pressable onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={C.textSecondary} />
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
              { backgroundColor: isAdmin ? "#8B5CF6" : C.tint, opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLogin ? "Sign In" : "Create Account"}</Text>
            )}
          </Pressable>

          {!isAdmin && (
            <Pressable onPress={switchMode} style={styles.switchBtn}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Text style={{ color: C.tint, fontFamily: "Inter_600SemiBold" }}>
                  {isLogin ? "Sign Up" : "Sign In"}
                </Text>
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  landing: {
    flex: 1,
    backgroundColor: C.background,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: C.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: C.tint,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  appTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: C.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 4,
  },
  rolePrompt: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  roleCards: {
    width: "100%",
    gap: 16,
  },
  roleCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  roleCardAdmin: {
    borderColor: "#8B5CF620",
  },
  roleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  roleCardTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.tint,
    marginBottom: 6,
  },
  roleCardSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 20,
  },
  roleArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  demoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 32,
  },
  demoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  container: {
    paddingHorizontal: 24,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  rolePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  rolePillText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  logoSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
  },
  logoCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitleSmall: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 24,
  },
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  eyeBtn: { padding: 4 },
  primaryBtn: {
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  switchBtn: {
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
});
