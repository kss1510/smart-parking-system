import React from "react";
import { View, Platform, StyleSheet } from "react-native";
import WebView from "react-native-webview";

const ZONE_COORDS: Record<string, [number, number]> = {
  A: [17.7436, 83.3728],
  B: [17.7442, 83.3736],
  C: [17.7448, 83.3744],
};

const USER_START: [number, number] = [17.7428, 83.3718];

function buildMapHtml(destLat: number, destLng: number, slotLabel: string, zoneName: string): string {
  const midLat = (USER_START[0] + destLat) / 2 + 0.0004;
  const midLng = (USER_START[1] + destLng) / 2;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#1a1a2e; font-family: -apple-system, sans-serif; }
    #map { width:100vw; height:100vh; }
    .you-label, .dest-label {
      background: white;
      border-radius: 20px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      border: 2px solid;
    }
    .you-label { color:#1565C0; border-color:#1565C0; }
    .dest-label { color:#004D36; border-color:#C9A02A; }
  </style>
</head>
<body>
<div id="map"></div>
<script>
  const map = L.map('map', { zoomControl: true, attributionControl: false });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const userLL  = [${USER_START[0]}, ${USER_START[1]}];
  const destLL  = [${destLat}, ${destLng}];
  const midLL   = [${midLat}, ${midLng}];

  // Draw bezier-like curved route via intermediate point
  const curve = [userLL, midLL, destLL];
  L.polyline(curve, { color:'#004D36', weight:5, opacity:0.85, lineJoin:'round' }).addTo(map);
  L.polyline(curve, { color:'#C9A02A', weight:2, opacity:0.6, dashArray:'6 4', lineJoin:'round' }).addTo(map);

  // Pulse animation for user dot
  const userIcon = L.divIcon({
    html: \`<div style="position:relative;">
      <div style="width:20px;height:20px;background:#1976D2;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);z-index:2;position:relative;"></div>
      <div style="width:32px;height:32px;background:rgba(25,118,210,0.3);border-radius:50%;position:absolute;top:-6px;left:-6px;animation:pulse 1.4s ease-out infinite;"></div>
    </div>
    <style>@keyframes pulse{0%{transform:scale(0.8);opacity:0.9}100%{transform:scale(2.2);opacity:0;}}</style>\`,
    iconSize: [20, 20], iconAnchor: [10, 10], className: ''
  });
  L.marker(userLL, { icon: userIcon }).addTo(map);

  // You label
  const youLabel = L.divIcon({
    html: '<div class="you-label">📍 You</div>',
    iconSize: [60, 24], iconAnchor: [-4, 36], className: ''
  });
  L.marker(userLL, { icon: youLabel }).addTo(map);

  // Destination pin
  const destIcon = L.divIcon({
    html: \`<div style="width:26px;height:26px;background:#004D36;border-radius:50%;border:4px solid #C9A02A;box-shadow:0 3px 10px rgba(0,0,0,0.5);"></div>\`,
    iconSize: [26, 26], iconAnchor: [13, 13], className: ''
  });
  L.marker(destLL, { icon: destIcon }).addTo(map);

  // Slot label
  const slotLabel = L.divIcon({
    html: '<div class="dest-label">🅿️ ${slotLabel}</div>',
    iconSize: [100, 24], iconAnchor: [-4, 36], className: ''
  });
  L.marker(destLL, { icon: slotLabel }).addTo(map);

  // Fit route in view with padding
  map.fitBounds([userLL, destLL], { padding: [55, 55] });
</script>
</body>
</html>`;
}

interface ParkingMapViewProps {
  zoneName: string;
  slotNumber: string;
}

export default function ParkingMapView({ zoneName, slotNumber }: ParkingMapViewProps) {
  const zoneKey = zoneName.replace("Zone ", "").trim().toUpperCase();
  const coords = ZONE_COORDS[zoneKey] ?? ZONE_COORDS["A"];
  const html = buildMapHtml(coords[0], coords[1], `Zone ${zoneKey} · ${slotNumber}`, zoneKey);

  if (Platform.OS === "web") {
    return (
      <View style={styles.container}>
        <iframe
          srcDoc={html}
          style={{ width: "100%", height: "100%", border: "none" }}
          sandbox="allow-scripts allow-same-origin"
          title="Parking Navigation"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ html }}
        style={styles.webview}
        javaScriptEnabled
        scrollEnabled={false}
        originWhitelist={["*"]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
  },
  webview: {
    flex: 1,
  },
});
