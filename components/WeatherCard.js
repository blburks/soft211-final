import { useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const WEATHER_ICONS = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧️',
  Drizzle: '🌦️',
  Thunderstorm: '⛈️',
  Snow: '❄️',
  Mist: '🌫️',
  Fog: '🌫️',
  Haze: '🌫️',
};

export default function WeatherCard({ weather, onRefresh, loading }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);

  // Fade + slide in whenever weather data changes
  useEffect(() => {
    if (weather) {
      opacity.value = 0;
      translateY.value = 20;
      opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) });
    }
  }, [weather]);

  // Pulse animation on refresh button press
  function handleRefresh() {
    scale.value = withSpring(0.92, {}, () => {
      scale.value = withSpring(1);
    });
    onRefresh();
  }

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!weather) return null;

  const icon = WEATHER_ICONS[weather.icon] ?? '🌡️';

  return (
    <Animated.View style={[styles.card, cardStyle]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.label}>Weather — {weather.city}</Text>
          <Text style={styles.temp}>{weather.temp}°F</Text>
          <Text style={styles.sub}>Feels like {weather.feels}°F</Text>
          <Text style={styles.sub}>Humidity: {weather.humidity}%</Text>
          <Text style={styles.description}>{weather.description}</Text>
        </View>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Animated.View style={buttonStyle}>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && styles.refreshBtnDisabled]}
          onPress={handleRefresh}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.refreshText}>{loading ? 'Refreshing...' : '↻ Refresh'}</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#E8F4FD',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  temp: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  sub: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: '#4A90E2',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  icon: {
    fontSize: 52,
    marginLeft: 12,
  },
  refreshBtn: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  refreshBtnDisabled: {
    backgroundColor: '#A0C4F1',
  },
  refreshText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
