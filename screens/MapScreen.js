import { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, Alert } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { scheduleNotification } from '../utils/notifications';

// Geofence: center and radius in meters
const GEOFENCE = {
  latitude: 47.6062,   // Seattle — change to a local landmark
  longitude: -122.3321,
  radius: 200,
  label: 'Seattle Center',
};

function isInsideGeofence(coords) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(coords.latitude - GEOFENCE.latitude);
  const dLon = toRad(coords.longitude - GEOFENCE.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(GEOFENCE.latitude)) *
      Math.cos(toRad(coords.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return dist <= GEOFENCE.radius;
}

export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [path, setPath] = useState([]);
  const [geofenceStatus, setGeofenceStatus] = useState('unknown'); // inside | outside | unknown
  const insideRef = useRef(false);
  const watchRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location access is needed to show the map.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setPath([{ latitude, longitude }]);

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
        (newLoc) => {
          const { latitude: lat, longitude: lon } = newLoc.coords;

          setRegion((prev) => ({ ...prev, latitude: lat, longitude: lon }));
          setPath((prev) => [...prev, { latitude: lat, longitude: lon }]);

          // Geofence detection
          const inside = isInsideGeofence({ latitude: lat, longitude: lon });
          if (inside && !insideRef.current) {
            insideRef.current = true;
            setGeofenceStatus('inside');
            scheduleNotification(
              '📍 Geofence Entered',
              `You entered the area near ${GEOFENCE.label}.`
            );
          } else if (!inside && insideRef.current) {
            insideRef.current = false;
            setGeofenceStatus('outside');
            scheduleNotification(
              '🚶 Geofence Exited',
              `You left the area near ${GEOFENCE.label}.`
            );
          }
        }
      );
    })();

    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  const geofenceColor =
    geofenceStatus === 'inside'
      ? 'rgba(76, 175, 80, 0.2)'
      : geofenceStatus === 'outside'
      ? 'rgba(244, 67, 54, 0.2)'
      : 'rgba(74, 144, 226, 0.2)';

  const geofenceBorder =
    geofenceStatus === 'inside' ? '#4CAF50' : geofenceStatus === 'outside' ? '#F44336' : '#4A90E2';

  return (
    <View style={styles.container}>
      {region ? (
        <MapView style={styles.map} region={region} showsUserLocation followsUserLocation>
          {/* Path polyline */}
          {path.length > 1 && (
            <Polyline
              coordinates={path}
              strokeColor="#4A90E2"
              strokeWidth={3}
            />
          )}

          {/* Geofence circle */}
          <Circle
            center={{ latitude: GEOFENCE.latitude, longitude: GEOFENCE.longitude }}
            radius={GEOFENCE.radius}
            fillColor={geofenceColor}
            strokeColor={geofenceBorder}
            strokeWidth={2}
          />

          {/* Geofence label marker */}
          <Marker
            coordinate={{ latitude: GEOFENCE.latitude, longitude: GEOFENCE.longitude }}
            title={GEOFENCE.label}
            description={`Geofence radius: ${GEOFENCE.radius}m`}
            pinColor={geofenceBorder}
          />
        </MapView>
      ) : (
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {/* Geofence status banner */}
      <View style={[styles.banner, { backgroundColor: geofenceBorder }]}>
        <Text style={styles.bannerText}>
          {geofenceStatus === 'inside'
            ? `✅ Inside geofence — ${GEOFENCE.label}`
            : geofenceStatus === 'outside'
            ? `❌ Outside geofence — ${GEOFENCE.label}`
            : `📍 Geofence: ${GEOFENCE.label}`}
        </Text>
        <Text style={styles.bannerSub}>Path points recorded: {path.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
  loadingText: { color: '#888' },
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 30,
  },
  bannerText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  bannerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
});
