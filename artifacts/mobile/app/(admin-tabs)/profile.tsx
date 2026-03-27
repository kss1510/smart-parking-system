import React from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

const C = Colors.light;

export default function AdminProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Sign out of admin session?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.hero, { paddingTop: topPad + 20 }]}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Feather name="shield" size={32} color="#fff" />
          </View>
          <View style={styles.adminDot} />
        </View>
        <Text style={styles.heroName}>{user?.name ?? "Administrator"}</Text>
        <Text style={styles.heroEmail}>{user?.email}</Text>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={12} color={C.gold} />
          <Text style={styles.adminBadgeText}>Admin / Security</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Capabilities</Text>
          {[
            { icon: "bar-chart-2", label: "Live monitoring & analytics dashboard" },
            { icon: "camera", label: "Scan and verify student QR codes" },
            { icon: "plus-circle", label: "Add new parking slots to zones" },
            { icon: "x-circle", label: "Force-free occupied slots with penalty" },
            { icon: "slash", label: "Block / unblock users for violations" },
          ].map((item, i) => (
            <View key={i} style={styles.capRow}>
              <View style={styles.capIcon}>
                <Feather name={item.icon as any} size={15} color={C.tint} />
              </View>
              <Text style={styles.capText}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Priority Queue System</Text>
          <View style={styles.prioRow}>
            <View style={[styles.prioChip, { backgroundColor: C.statusFree + "20" }]}>
              <Text style={[styles.prioChipNum, { color: C.statusFree }]}>+1</Text>
              <Text style={styles.prioChipLabel}>On Entry</Text>
            </View>
            <View style={[styles.prioChip, { backgroundColor: C.tint + "15" }]}>
              <Text style={[styles.prioChipNum, { color: C.tint }]}>−1</Text>
              <Text style={styles.prioChipLabel}>On Exit</Text>
            </View>
            <View style={[styles.prioChip, { backgroundColor: C.statusOccupied + "20" }]}>
              <Text style={[styles.prioChipNum, { color: C.statusOccupied }]}>−1</Text>
              <Text style={styles.prioChipLabel}>No Exit</Text>
            </View>
          </View>
          <Text style={styles.prioNote}>
            Users who always exit properly maintain a score of 0 (ideal). Those who skip exit get penalized to −1, reducing their slot allocation priority. Force-freeing a slot applies the penalty automatically.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Code</Text>
          <View style={styles.codeRow}>
            <Feather name="lock" size={16} color={C.textSecondary} />
            <Text style={styles.codeText}>ADMIN123</Text>
            <Text style={styles.codeNote}>Required for admin registration</Text>
          </View>
        </View>

        <Pressable onPress={handleSignOut} style={styles.signOutBtn}>
          <Feather name="log-out" size={18} color={C.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    backgroundColor: C.tint, alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 32,
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.3)",
  },
  adminDot: {
    position: "absolute", bottom: 2, right: 2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: C.gold, borderWidth: 2, borderColor: C.tint,
  },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  heroEmail: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)", marginBottom: 12 },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  adminBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.text, marginBottom: 14 },
  capRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  capIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.tint + "12", alignItems: "center", justifyContent: "center" },
  capText: { fontSize: 13, fontFamily: "Inter_400Regular", color: C.text, flex: 1 },
  prioRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  prioChip: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  prioChipNum: { fontSize: 22, fontFamily: "Inter_700Bold" },
  prioChipLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.textSecondary, marginTop: 2 },
  prioNote: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.background, borderRadius: 10, padding: 12 },
  codeText: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: 2, flex: 1 },
  codeNote: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: C.dangerLight, borderRadius: 16, paddingVertical: 16, marginTop: 8 },
  signOutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.danger },
});
