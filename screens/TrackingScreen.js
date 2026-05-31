import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  FlatList, ScrollView, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleNotification, requestNotificationPermission } from '../utils/notifications';

const STORAGE_KEY = 'location_logs';
const GOAL_DISTANCE_METERS = 100;

function haversineDistance(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export default function TrackingScreen() {
  const [status, setStatus] = useState('stopped'); // stopped | tracking | paused
  const [currentLocation, setCurrentLocation] = useState(null);
  const [logs, setLogs] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [goalReached, setGoalReached] = useState(false);
  const watchRef = useRef(null);
  const lastCoords = useRef(null);

  // Load persisted logs on mount
  useEffect(() => {
    (async () => {
      await requestNotificationPermission();
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) setLogs(JSON.parse(saved));
    })();
  }, []);

  async function saveLogs(newLogs) {
    setLogs(newLogs);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
  }

  async function startTracking() {
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Location access is required to track your movement. Please enable it in Settings.'
      );
      return;
    }

    setStatus('tracking');
    setGoalReached(false);
    setTotalDistance(0);
    lastCoords.current = null;

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      async (loc) => {
        setCurrentLocation(loc);
        const coords = loc.coords;

        let added = 0;
        if (lastCoords.current) {
          added = haversineDistance(lastCoords.current, coords);
        }
        lastCoords.current = coords;

        setTotalDistance((prev) => {
          const next = prev + added;
          if (!goalReached && next >= GOAL_DISTANCE_METERS) {
            setGoalReached(true);
            scheduleNotification(
              '🎯 Goal Reached!',
              `You've traveled ${GOAL_DISTANCE_METERS}m — great work!`
            );
          }
          return next;
        });

        const entry = {
          id: Date.now().toString(),
          lat: coords.latitude.toFixed(6),
          lon: coords.longitude.toFixed(6),
          time: new Date(loc.timestamp).toLocaleTimeString(),
        };

        setLogs((prev) => {
          const updated = [entry, ...prev.slice(0, 49)];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    );
  }

  async function pauseTracking() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setStatus('paused');
    await scheduleNotification(
      '⏸ Tracking Paused',
      'Your location tracking has been paused. Tap Resume when ready.'
    );
  }

  async function resumeTracking() {
    setStatus('tracking');
    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      async (loc) => {
        setCurrentLocation(loc);
        const coords = loc.coords;
        let added = 0;
        if (lastCoords.current) {
          added = haversineDistance(lastCoords.current, coords);
        }
        lastCoords.current = coords;
        setTotalDistance((prev) => prev + added);

        const entry = {
          id: Date.now().toString(),
          lat: coords.latitude.toFixed(6),
          lon: coords.longitude.toFixed(6),
          time: new Date(loc.timestamp).toLocaleTimeString(),
        };
        setLogs((prev) => {
          const updated = [entry, ...prev.slice(0, 49)];
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    );
  }

  function stopTracking() {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setStatus('stopped');
    lastCoords.current = null;
  }

  async function clearLogs() {
    await saveLogs([]);
    setTotalDistance(0);
    setGoalReached(false);
  }

  useEffect(() => {
    return () => {
      if (watchRef.current) watchRef.current.remove();
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Location Tracking</Text>

      {/* Privacy Notice */}
      <View style={styles.privacyBox}>
        <Text style={styles.privacyTitle}>Privacy Notice</Text>
        <Text style={styles.privacyText}>
          • This app collects your GPS coordinates while tracking is active.{'\n'}
          • Data is collected only when tracking is started or resumed.{'\n'}
          • All data is stored locally on your device — nothing is sent to a server.{'\n'}
          • You can pause or stop tracking at any time using the buttons below.
        </Text>
      </View>

      {/* Current Location */}
      {currentLocation && (
        <View style={styles.card}>
          <Text style={styles.label}>Current Position</Text>
          <Text style={styles.value}>Lat: {currentLocation.coords.latitude.toFixed(6)}</Text>
          <Text style={styles.value}>Lon: {currentLocation.coords.longitude.toFixed(6)}</Text>
          <Text style={styles.value}>Distance: {totalDistance.toFixed(1)} m</Text>
          {goalReached && <Text style={styles.goal}>🎯 Goal reached!</Text>}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        {status === 'stopped' && (
          <TouchableOpacity style={styles.btnStart} onPress={startTracking}>
            <Text style={styles.btnText}>▶ Start Tracking</Text>
          </TouchableOpacity>
        )}
        {status === 'tracking' && (
          <>
            <TouchableOpacity style={styles.btnPause} onPress={pauseTracking}>
              <Text style={styles.btnText}>⏸ Pause</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnStop} onPress={stopTracking}>
              <Text style={styles.btnText}>⏹ Stop</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'paused' && (
          <>
            <TouchableOpacity style={styles.btnStart} onPress={resumeTracking}>
              <Text style={styles.btnText}>▶ Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnStop} onPress={stopTracking}>
              <Text style={styles.btnText}>⏹ Stop</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.statusText}>
        Status: <Text style={styles.statusValue}>{status.toUpperCase()}</Text>
      </Text>

      {/* Log */}
      <View style={styles.logHeader}>
        <Text style={styles.historyTitle}>Location Log ({logs.length})</Text>
        {logs.length > 0 && (
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {logs.slice(0, 10).map((item) => (
        <View key={item.id} style={styles.logItem}>
          <Text style={styles.logText}>{item.time} — {item.lat}, {item.lon}</Text>
        </View>
      ))}
      {logs.length === 0 && (
        <Text style={styles.empty}>No logs yet. Start tracking to record your location.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1A237E', marginBottom: 16, textAlign: 'center' },
  privacyBox: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FFC107' },
  privacyTitle: { fontWeight: 'bold', color: '#795548', marginBottom: 6, fontSize: 13 },
  privacyText: { fontSize: 12, color: '#666', lineHeight: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3 },
  label: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  value: { fontSize: 15, color: '#333', marginBottom: 2 },
  goal: { fontSize: 15, color: '#4CAF50', fontWeight: 'bold', marginTop: 6 },
  controls: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnStart: { flex: 1, backgroundColor: '#4CAF50', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnPause: { flex: 1, backgroundColor: '#FF9800', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnStop: { flex: 1, backgroundColor: '#F44336', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusText: { fontSize: 13, color: '#888', marginBottom: 16, textAlign: 'center' },
  statusValue: { color: '#1A237E', fontWeight: 'bold' },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTitle: { fontSize: 16, fontWeight: '600', color: '#1A237E' },
  clearBtn: { fontSize: 13, color: '#F44336' },
  logItem: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 6 },
  logText: { fontSize: 12, color: '#555' },
  empty: { color: '#aaa', textAlign: 'center', marginTop: 16 },
});
