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
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [name, setName] = useState("");
  const [registrationId, setRegistrationId] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter email and password.");
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
          adminCode: adminCode.trim() || undefined,
        });
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setName(""); setRegistrationId(""); setVehicleNumber(""); setAdminCode(""); setShowAdminField(false);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40), paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Feather name="map-pin" size={36} color="#fff" />
          </View>
          <Text style={styles.appTitle}>CampusPark</Text>
          <Text style={styles.appSubtitle}>Smart Parking Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{isLogin ? "Welcome Back" : "Create Account"}</Text>
          <Text style={styles.cardSub}>{isLogin ? "Sign in to manage parking" : "Get started with CampusPark"}</Text>

          {!isLogin && (
            <InputField
              icon="user" label="Full Name" placeholder="John Smith"
              value={name} onChangeText={setName} autoCapitalize="words"
            />
          )}

          <InputField
            icon="mail" label="Email" placeholder="you@university.edu"
            value={email} onChangeText={setEmail} keyboardType="email-address"
          />

          {!isLogin && (
            <InputField
              icon="credit-card" label="Registration ID" placeholder="REG2024001 (optional)"
              value={registrationId} onChangeText={setRegistrationId}
            />
          )}

          {!isLogin && (
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

          {!isLogin && (
            <Pressable onPress={() => setShowAdminField(!showAdminField)} style={styles.adminToggle}>
              <Feather name={showAdminField ? "chevron-up" : "shield"} size={14} color={C.textSecondary} />
              <Text style={styles.adminToggleText}>
                {showAdminField ? "Hide admin code" : "Register as admin (security staff)"}
              </Text>
            </Pressable>
          )}

          {!isLogin && showAdminField && (
            <InputField
              icon="shield" label="Admin Secret Code" placeholder="Enter code to register as admin"
              value={adminCode} onChangeText={setAdminCode}
            />
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{isLogin ? "Sign In" : "Create Account"}</Text>
            )}
          </Pressable>

          <Pressable onPress={switchMode} style={styles.switchBtn}>
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={{ color: C.tint, fontFamily: "Inter_600SemiBold" }}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </Text>
          </Pressable>
        </View>

        <View style={styles.demoHint}>
          <Feather name="info" size={14} color={C.textSecondary} />
          <Text style={styles.demoText}>Demo: use any email & password to get started</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appTitle: {
    fontSize: 30,
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
    marginBottom: 20,
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
  inputGroup: {
    marginBottom: 16,
  },
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  eyeBtn: {
    padding: 4,
  },
  primaryBtn: {
    backgroundColor: C.tint,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: C.tint,
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
  demoHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  demoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  adminToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    marginBottom: 4,
  },
  adminToggleText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.textSecondary,
  },
});
