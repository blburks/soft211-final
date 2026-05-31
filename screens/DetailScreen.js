import { StyleSheet, Text, View, TouchableOpacity, Linking, Alert } from 'react-native';

const LOCATIONS = {
  seattle: { name: 'Seattle Center', address: '305 Harrison St, Seattle, WA', lat: 47.6205, lon: -122.3493, phone: '2062843200' },
  pike: { name: 'Pike Place Market', address: '85 Pike St, Seattle, WA', lat: 47.6085, lon: -122.3406, phone: '2068825353' },
  space: { name: 'Space Needle', address: '400 Broad St, Seattle, WA', lat: 47.6205, lon: -122.3493, phone: '2069052100' },
};

export default function DetailScreen({ route }) {
  // Safe deep link param handling — default to 'seattle' if missing or invalid
  const rawId = route?.params?.id ?? 'seattle';
  const id = rawId.toLowerCase();
  const location = LOCATIONS[id] ?? LOCATIONS.seattle;

  async function openMaps() {
    const url = `geo:${location.lat},${location.lon}?q=${encodeURIComponent(location.address)}`;
    const fallback = `https://maps.google.com/?q=${encodeURIComponent(location.address)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      await Linking.openURL(supported ? url : fallback);
    } catch {
      Alert.alert('Error', 'Could not open maps app.');
    }
  }

  async function openDialer() {
    const url = `tel:${location.phone}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Not Supported', 'Phone dialer is not available on this device.');
      }
    } catch {
      Alert.alert('Error', 'Could not open the dialer.');
    }
  }

  async function openWeb() {
    const url = `https://www.google.com/search?q=${encodeURIComponent(location.name)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open the browser.');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{location.name}</Text>
      <Text style={styles.id}>ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Address</Text>
        <Text style={styles.value}>{location.address}</Text>
        <Text style={styles.label}>Coordinates</Text>
        <Text style={styles.value}>{location.lat}, {location.lon}</Text>
      </View>

      <Text style={styles.sectionTitle}>External Actions</Text>

      <TouchableOpacity style={styles.btn} onPress={openMaps}>
        <Text style={styles.btnText}>🗺 Open in Maps</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnGreen]} onPress={openDialer}>
        <Text style={styles.btnText}>📞 Call Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnGray]} onPress={openWeb}>
        <Text style={styles.btnText}>🌐 Search the Web</Text>
      </TouchableOpacity>

      <View style={styles.deepLinkInfo}>
        <Text style={styles.deepLinkTitle}>Deep Link Format</Text>
        <Text style={styles.deepLinkText}>weatherapp://detail/seattle</Text>
        <Text style={styles.deepLinkText}>weatherapp://detail/pike</Text>
        <Text style={styles.deepLinkText}>weatherapp://detail/space</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A237E', marginBottom: 4 },
  id: { fontSize: 13, color: '#888', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 24, elevation: 3 },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2, marginTop: 8 },
  value: { fontSize: 15, color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1A237E', marginBottom: 12 },
  btn: { backgroundColor: '#4A90E2', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  btnGreen: { backgroundColor: '#4CAF50' },
  btnGray: { backgroundColor: '#607D8B' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  deepLinkInfo: { backgroundColor: '#E8EAF6', borderRadius: 10, padding: 14, marginTop: 10 },
  deepLinkTitle: { fontWeight: 'bold', color: '#3949AB', marginBottom: 6, fontSize: 13 },
  deepLinkText: { fontSize: 12, color: '#3949AB', fontFamily: 'monospace', marginBottom: 2 },
});
