import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

import HomeScreen from './screens/HomeScreen';
import TrackingScreen from './screens/TrackingScreen';
import MapScreen from './screens/MapScreen';
import NotesScreen from './screens/NotesScreen';
import DetailScreen from './screens/DetailScreen';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Must be at module level
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) { console.error('BG location error:', error); return; }
  if (data) console.log('BG location update:', data.locations);
});

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Deep link config
const linking = {
  prefixes: [Linking.createURL('/'), 'weatherapp://'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Tracking: 'tracking',
          Map: 'map',
          Notes: 'notes',
        },
      },
      Detail: 'detail/:id',
    },
  },
};

function TabIcon({ label, active }) {
  const icons = { Home: '🏠', Tracking: '📍', Map: '🗺', Notes: '📝' };
  return <Text style={{ fontSize: 20, opacity: active ? 1 : 0.5 }}>{icons[label]}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} active={focused} />,
        tabBarActiveTintColor: '#1A237E',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { paddingBottom: 6, paddingTop: 4 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tracking" component={TrackingScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{ headerShown: true, title: 'Location Detail' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
