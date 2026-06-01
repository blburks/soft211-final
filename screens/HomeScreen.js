import { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  AppState,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import WeatherCard from '../components/WeatherCard';

const OPENWEATHER_API_KEY = '7ce3113dbe1c03ad914a4290ab3f2c02';
const BACKGROUND_LOCATION_TASK = 'background-location-task';

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [networkState, setNetworkState] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [activeTab, setActiveTab] = useState('home');
  const watchRef = useRef(null);
  const latestCoords = useRef(null);

  // Animated tab indicator
  const tabIndicatorX = useSharedValue(0);
  const tabIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorX.value }],
  }));

  function switchTab(tab) {
    setActiveTab(tab);
    tabIndicatorX.value = withTiming(tab === 'home' ? 0 : 160, { duration: 250 });
  }

  // Broadcast Intent #1 — network state changes
  useEffect(() => {
    const networkSub = Network.addNetworkStateListener((state) => {
      setNetworkState(state);
    });
    Network.getNetworkStateAsync().then(setNetworkState);
    return () => networkSub.remove();
  }, []);

  // Broadcast Intent #2 — app foreground/background changes
  useEffect(() => {
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });
    return () => appStateSub.remove();
  }, []);

  // Location setup
  useEffect(() => {
    (async () => {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setErrorMsg('Foreground location permission denied.');
        setLoading(false);
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(current);
      latestCoords.current = current.coords;
      setLoading(false);
      fetchWeather(current.coords.latitude, current.coords.longitude);

      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          setLocation(newLocation);
          latestCoords.current = newLocation.coords;
          setLocationHistory((prev) => [
            {
              id: Date.now().toString(),
              lat: newLocation.coords.latitude.toFixed(5),
              lon: newLocation.coords.longitude.toFixed(5),
              time: new Date(newLocation.timestamp).toLocaleTimeString(),
            },
            ...prev.slice(0, 9),
          ]);
          fetchWeather(newLocation.coords.latitude, newLocation.coords.longitude);
        }
      );

      // Start background location updates
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === 'granted') {
        const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(
          BACKGROUND_LOCATION_TASK
        );
        if (!alreadyStarted) {
          await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 50,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'Nearby Weather Explorer',
              notificationBody: 'Tracking your location in the background.',
            },
          });
        }
      }
    })();

    return () => {
      if (watchRef.current) watchRef.current.remove();
      Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).then((started) => {
        if (started) Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      });
    };
  }, []);

  async function fetchWeather(lat, lon) {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected) return;

    setWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${OPENWEATHER_API_KEY}`
      );
      const data = await res.json();
      if (data.cod === 200) {
        setWeather({
          city: data.name,
          temp: Math.round(data.main.temp),
          feels: Math.round(data.main.feels_like),
          humidity: data.main.humidity,
          description: data.weather[0].description,
          icon: data.weather[0].main,
        });
      }
    } catch (e) {
      console.error('Weather fetch error:', e);
    } finally {
      setWeatherLoading(false);
    }
  }

  function handleRefresh() {
    if (latestCoords.current) {
      fetchWeather(latestCoords.current.latitude, latestCoords.current.longitude);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Weather Explorer</Text>

      {/* Deep link shortcut */}
      <TouchableOpacity
        style={styles.deepLinkBtn}
        onPress={() => navigation.navigate('Detail', { id: 'seattle' })}
      >
        <Text style={styles.deepLinkBtnText}>📍 View Location Detail</Text>
      </TouchableOpacity>

      {/* Offline banner */}
      {networkState && !networkState.isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Offline — showing cached data</Text>
        </View>
      )}

      {/* Status line */}
      <Text style={styles.statusBadge}>
        App: {appState} · Network: {networkState?.type ?? '...'}
      </Text>

      {/* Animated tab bar */}
      <View style={styles.tabBar}>
        <Animated.View style={[styles.tabIndicator, tabIndicatorStyle]} />
        <TouchableOpacity style={styles.tab} onPress={() => switchTab('home')}>
          <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>
            🏠 Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => switchTab('history')}>
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            📍 History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Home tab */}
      {activeTab === 'home' && (
        <View style={styles.tabContent}>
          {location && (
            <View style={styles.card}>
              <Text style={styles.label}>Current Location</Text>
              <Text style={styles.value}>Lat: {location.coords.latitude.toFixed(5)}</Text>
              <Text style={styles.value}>Lon: {location.coords.longitude.toFixed(5)}</Text>
              <Text style={styles.value}>
                Accuracy: {location.coords.accuracy?.toFixed(1)} m
              </Text>
            </View>
          )}

          <WeatherCard
            weather={weather}
            onRefresh={handleRefresh}
            loading={weatherLoading}
          />
        </View>
      )}

      {/* History tab */}
      {activeTab === 'history' && (
        <View style={styles.tabContent}>
          <Text style={styles.historyTitle}>Location History</Text>
          <FlatList
            data={locationHistory}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.historyItem}>
                <Text style={styles.historyText}>
                  {item.time} — {item.lat}, {item.lon}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>Move around to see location updates.</Text>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusBadge: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginBottom: 14,
  },
  offlineBanner: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  offlineText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabIndicator: {
    position: 'absolute',
    width: 160,
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 10,
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  historyText: {
    fontSize: 13,
    color: '#555',
  },
  empty: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    padding: 20,
  },
  deepLinkBtn: {
    backgroundColor: '#E8EAF6',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  deepLinkBtnText: {
    color: '#3949AB',
    fontWeight: '600',
    fontSize: 13,
  },
});
