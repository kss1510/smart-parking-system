import React, { useState } from "react";
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { customFetch } from "@workspace/api-client-react";
import { useParking } from "@/context/ParkingContext";

const C = Colors.light;

const SLOT_TYPES = [
  { key: "ANY", label: "General", icon: "grid", color: C.tint },
  { key: "FACULTY", label: "Faculty Only", icon: "shield", color: "#8B5CF6" },
  { key: "STUDENT", label: "Student Only", icon: "user", color: C.zoneB },
];

export default function AddSlotScreen() {
  const insets = useSafeAreaInsets();
  const { zones, refreshZones, showNotification } = useParking();
  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [slotNumber, setSlotNumber] = useState("");
  const [slotType, setSlotType] = useState("ANY");
  const [loading, setLoading] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);

  const selectedZone = zones.find(z => z.id === selectedZoneId);

  const autoFillSlotNumber = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return;
    const nextNum = zone.totalSlots + 1;
    setSlotNumber(`${zone.name}${nextNum}`);
  };

  const handleSelectZone = (zoneId: number) => {
    setSelectedZoneId(zoneId);
    autoFillSlotNumber(zoneId);
  };

  const handleAddSlot = async () => {
    if (!selectedZoneId || !slotNumber.trim()) {
      showNotification("Select a zone and enter a slot number.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    try {
      await customFetch("/api/slots/admin/add", {
        method: "POST",
        body: JSON.stringify({
          zoneId: selectedZoneId,
          slotNumber: slotNumber.trim().toUpperCase(),
          slotType,
        }),
      });
      setRecentlyAdded(prev => [`Zone ${selectedZone?.name} · ${slotNumber.trim().toUpperCase()}`, ...prev.slice(0, 4)]);
      showNotification(`Slot ${slotNumber.trim().toUpperCase()} added to Zone ${selectedZone?.name}!`);
      await refreshZones();
      autoFillSlotNumber(selectedZoneId);
    } catch (e: any) {
      showNotification(e?.message ?? "Failed to add slot.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerIcon}>
          <Feather name="plus-circle" size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add Parking Slot</Text>
          <Text style={styles.headerSub}>Expand campus parking capacity</Text>
        </View>
        <View style={styles.adminBadge}>
          <Feather name="shield" size={12} color={C.gold} />
          <Text style={styles.adminBadgeText}>Admin</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Select Zone</Text>
        <View style={styles.zonesRow}>
          {zones.map(zone => (
            <Pressable
              key={zone.id}
              onPress={() => handleSelectZone(zone.id)}
              style={[styles.zoneCard, selectedZoneId === zone.id && styles.zoneCardActive]}
            >
              <Text style={[styles.zoneCardLetter, selectedZoneId === zone.id && styles.zoneCardLetterActive]}>
                {zone.name}
              </Text>
              <Text style={[styles.zoneCardSlots, selectedZoneId === zone.id && { color: "#fff" }]}>
                {zone.totalSlots} slots
              </Text>
              <Text style={[styles.zoneCardFree, selectedZoneId === zone.id && { color: "rgba(255,255,255,0.7)" }]}>
                {zone.freeSlots} free
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Slot Type</Text>
        <View style={styles.typeRow}>
          {SLOT_TYPES.map(t => (
            <Pressable
              key={t.key}
              onPress={() => setSlotType(t.key)}
              style={[styles.typeChip, slotType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
            >
              <Feather name={t.icon as any} size={14} color={slotType === t.key ? "#fff" : C.textSecondary} />
              <Text style={[styles.typeChipText, slotType === t.key && { color: "#fff" }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Slot Number</Text>
        <View style={styles.inputCard}>
          <View style={styles.inputRow}>
            <Feather name="hash" size={16} color={C.tint} />
            <TextInput
              style={styles.input}
              placeholder={selectedZone ? `e.g. ${selectedZone.name}${selectedZone.totalSlots + 1}` : "Select a zone first"}
              placeholderTextColor={C.textSecondary}
              value={slotNumber}
              onChangeText={t => setSlotNumber(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              editable={!!selectedZoneId}
            />
            {slotNumber.length > 0 && (
              <Pressable onPress={() => setSlotNumber("")}>
                <Feather name="x" size={16} color={C.textSecondary} />
              </Pressable>
            )}
          </View>
          {selectedZone && (
            <Text style={styles.inputHint}>
              Zone {selectedZone.name} currently has {selectedZone.totalSlots} slots
            </Text>
          )}
        </View>

        <Pressable
          onPress={handleAddSlot}
          disabled={loading || !selectedZoneId || !slotNumber.trim()}
          style={({ pressed }) => [
            styles.addBtn,
            { opacity: pressed || loading || !selectedZoneId || !slotNumber.trim() ? 0.7 : 1 }
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Add Slot</Text>
            </>
          )}
        </Pressable>

        {recentlyAdded.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Recently Added</Text>
            {recentlyAdded.map((s, i) => (
              <View key={i} style={styles.recentRow}>
                <View style={styles.recentIcon}>
                  <Feather name="check" size={14} color={C.statusFree} />
                </View>
                <Text style={styles.recentText}>{s}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.infoCard}>
          <Feather name="info" size={16} color={C.tint} />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Priority Queue Impact</Text>
            <Text style={styles.infoText}>
              Adding more slots helps users with lower priority scores still find parking. The system automatically assigns optimal slots using Dijkstra routing based on each user's priority score (0 = ideal, negative = penalized).
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 18, backgroundColor: C.tint,
  },
  headerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  adminBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  adminBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  zonesRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  zoneCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: "center", borderWidth: 2, borderColor: C.border },
  zoneCardActive: { backgroundColor: C.tint, borderColor: C.tint },
  zoneCardLetter: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.tint },
  zoneCardLetterActive: { color: "#fff" },
  zoneCardSlots: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.text, marginTop: 4 },
  zoneCardFree: { fontSize: 11, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 2 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap" },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: C.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  typeChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.textSecondary },
  inputCard: { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: C.border },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.background, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: C.border },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.text, letterSpacing: 1 },
  inputHint: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 10 },
  addBtn: { backgroundColor: C.tint, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 17, gap: 10, marginBottom: 8 },
  addBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  recentRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  recentIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.statusFree + "20", alignItems: "center", justifyContent: "center" },
  recentText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.text },
  infoCard: { flexDirection: "row", gap: 12, backgroundColor: C.tint + "08", borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.tint + "20" },
  infoTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.tint, marginBottom: 4 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, lineHeight: 18 },
});
