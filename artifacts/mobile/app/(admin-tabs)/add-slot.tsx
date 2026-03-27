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
    setSlotNumber(`${zone.name}${zone.totalSlots + 1}`);
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
        body: JSON.stringify({ zoneId: selectedZoneId, slotNumber: slotNumber.trim().toUpperCase(), slotType }),
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
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroHeader, { paddingTop: topPad + 20 }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconWrap}>
              <Feather name="plus-circle" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Add Parking Slot</Text>
              <Text style={styles.heroSub}>Expand campus parking capacity</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionLabel}>Select Zone</Text>
          <View style={styles.sectionCard}>
            {zones.map((zone, i) => (
              <React.Fragment key={zone.id}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleSelectZone(zone.id); }}
                  style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: selectedZoneId === zone.id ? C.tint : C.tint + "12" }]}>
                    <Text style={[styles.zoneLetterText, { color: selectedZoneId === zone.id ? "#fff" : C.tint }]}>{zone.name}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>Zone {zone.name}</Text>
                    <Text style={styles.menuSub}>{zone.totalSlots} slots · {zone.freeSlots} free</Text>
                  </View>
                  {selectedZoneId === zone.id ? (
                    <View style={styles.selectedBadge}>
                      <Feather name="check" size={14} color={C.tint} />
                    </View>
                  ) : (
                    <Feather name="chevron-right" size={17} color={C.border} />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Slot Type</Text>
          <View style={styles.sectionCard}>
            {SLOT_TYPES.map((t, i) => (
              <React.Fragment key={t.key}>
                {i > 0 && <View style={styles.divider} />}
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSlotType(t.key); }}
                  style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <View style={[styles.menuIcon, { backgroundColor: slotType === t.key ? t.color + "20" : t.color + "10" }]}>
                    <Feather name={t.icon as any} size={17} color={t.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuLabel}>{t.label}</Text>
                    <Text style={styles.menuSub}>
                      {t.key === "ANY" ? "Available to all users" : t.key === "FACULTY" ? "Faculty staff only (purple in heatmap)" : "Students only"}
                    </Text>
                  </View>
                  {slotType === t.key && (
                    <View style={[styles.selectedBadge, { borderColor: t.color }]}>
                      <Feather name="check" size={14} color={t.color} />
                    </View>
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>

          <Text style={styles.sectionLabel}>Slot Number</Text>
          <View style={styles.sectionCard}>
            <View style={styles.menuRow}>
              <View style={[styles.menuIcon, { backgroundColor: selectedZoneId ? C.tint + "12" : C.borderLight }]}>
                <Feather name="hash" size={17} color={selectedZoneId ? C.tint : C.textSecondary} />
              </View>
              <TextInput
                style={[styles.slotInput, !selectedZoneId && { color: C.textSecondary }]}
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
                <Pressable onPress={() => setSlotNumber("")} style={{ padding: 4 }}>
                  <Feather name="x" size={16} color={C.textSecondary} />
                </Pressable>
              )}
            </View>
          </View>

          <Pressable
            onPress={handleAddSlot}
            disabled={loading || !selectedZoneId || !slotNumber.trim()}
            style={({ pressed }) => [
              styles.addBtn,
              { opacity: pressed || loading || !selectedZoneId || !slotNumber.trim() ? 0.65 : 1 }
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
              <Text style={styles.sectionLabel}>Recently Added</Text>
              <View style={styles.sectionCard}>
                {recentlyAdded.map((s, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={styles.divider} />}
                    <View style={styles.menuRow}>
                      <View style={[styles.menuIcon, { backgroundColor: C.statusFree + "20" }]}>
                        <Feather name="check" size={17} color={C.statusFree} />
                      </View>
                      <Text style={styles.menuLabel}>{s}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: {},
  heroHeader: { backgroundColor: C.tint, paddingHorizontal: 20, paddingBottom: 24 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  heroIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  heroSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.62)", marginTop: 2 },
  body: { paddingHorizontal: 18, paddingTop: 18 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: C.textSecondary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, marginTop: 4 },
  sectionCard: { backgroundColor: C.surface, borderRadius: 16, overflow: "hidden", marginBottom: 18, borderWidth: 1, borderColor: C.border, shadowColor: "#004D36", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  divider: { height: 1, backgroundColor: C.borderLight, marginLeft: 62 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.text },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: C.textSecondary, marginTop: 1 },
  zoneLetterText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  selectedBadge: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: C.tint, alignItems: "center", justifyContent: "center" },
  slotInput: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: C.text, letterSpacing: 1.5 },
  addBtn: { backgroundColor: C.tint, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, gap: 10, marginBottom: 8 },
  addBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
