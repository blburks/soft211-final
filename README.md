# Nearby Weather Explorer

A mobile application built with React Native and Expo for SOFT 211 — Mobile Application Development.

## Description

Nearby Weather Explorer is a location-aware mobile app that combines real-time GPS tracking, live weather data, interactive maps, geofencing, local notifications, and offline-first field notes into a single cohesive experience. The app demonstrates core mobile programming concepts covered throughout the quarter.

## Screens

| Screen | Description |
|---|---|
| **Home** | Shows current location coordinates, live weather from OpenWeatherMap, network status, and app state |
| **Tracking** | Start, pause, and resume GPS tracking with a distance goal, privacy notice, and persisted location log |
| **Map** | Interactive map with a live polyline path and a geofence that detects when you enter or exit an area |
| **Notes** | Offline-first field notes with local storage, pending/synced status, and a manual Sync Now button |
| **Detail** | Deep link target screen with location info, external maps, phone dialer, and web search |

## Features

### Location & Background Services
- Requests foreground and background location permissions
- Displays current GPS coordinates and accuracy
- Live location tracking with `watchPositionAsync`
- Background location task via `expo-task-manager` that continues when the app is minimized
- Pause and resume tracking without ending the session
- Distance tracking with a configurable goal (default: 100 meters)
- Location log persisted locally with AsyncStorage — survives app restarts

### Broadcast Intents & System Events
- Listens for network connectivity changes with `expo-network`
- Listens for app foreground/background state changes with React Native `AppState`
- Offline banner displayed automatically when the device loses connection

### Local Notifications
- Notification fires when tracking is **paused** — reminds the user tracking has stopped
- Notification fires when the **distance goal is reached** — celebrates the achievement
- Notification fires on **geofence entry and exit** — contextual location awareness
- Notification permissions requested on first launch

### External API
- **OpenWeatherMap** current weather API — fetches live temperature, humidity, feels-like, and conditions using GPS coordinates
- Weather refreshes automatically on location update or manually via the Refresh button
- Gracefully skips fetch when offline

### Maps & Geofencing
- Full interactive map via `react-native-maps`
- Blue polyline drawn in real time as the user moves
- Geofence circle rendered on the map with color feedback (blue → green on entry, red on exit)
- Enter and exit events trigger local notifications

### Deep Links & External Actions
- Custom URL scheme: `weatherapp://detail/:id`
- Opens the Detail screen directly from a browser or notes app
- Supported IDs: `seattle`, `pike`, `space`
- Opens the device maps app for navigation
- Opens the phone dialer
- Opens a web search for the selected location
- Safe handling of missing or invalid deep link parameters — no crashes

### Offline-First Field Notes
- Create notes instantly — stored locally before any sync attempt
- Notes marked as **Pending** until synced, **Synced** after success
- **Sync Now** button attempts sync and marks notes on success
- Failed syncs keep notes in the queue for retry
- All notes persist across app restarts via AsyncStorage

### UI & Animation
- Animated sliding tab indicator (Reanimated `withTiming`)
- Weather card fade and slide-in on each data update
- Refresh button spring press animation (`withSpring`)
- Emoji weather icons that match current conditions (☀️ ☁️ 🌧️ ❄️ ⛈️)
- Offline banner, geofence status banner, and sync status bar

## Libraries Used

| Library | Purpose |
|---|---|
| `expo-location` | GPS tracking, foreground & background location |
| `expo-task-manager` | Background task registration |
| `expo-network` | Network state listener and connectivity checks |
| `expo-notifications` | Local notification scheduling |
| `expo-linking` | Deep link URL handling |
| `react-native-maps` | Interactive map, polyline, geofence circle |
| `react-native-reanimated` | Smooth animations and transitions |
| `@react-native-async-storage/async-storage` | Local data persistence |
| `@react-navigation/native` | Screen navigation |
| `@react-navigation/bottom-tabs` | Bottom tab bar |
| `@react-navigation/stack` | Stack navigation for deep link screens |

## External API

**OpenWeatherMap** — Current Weather Data  
`https://api.openweathermap.org/data/2.5/weather`  
Free tier. Sign up at openweathermap.org to get an API key.

## Setup

1. Clone the repository
   ```
   git clone https://github.com/blburks/soft211-final.git
   cd soft211-final
   ```
2. Install dependencies
   ```
   npm install
   ```
3. Add your OpenWeatherMap API key in `screens/HomeScreen.js` line 20
4. Start the app
   ```
   npx expo start
   ```
5. Scan the QR code with the Expo Go app on your device

## Testing Deep Links

Open a browser or notes app on your device and navigate to:
```
weatherapp://detail/seattle
weatherapp://detail/pike
weatherapp://detail/space
```

## Course Outcomes Addressed

| Outcome | Implementation |
|---|---|
| Application life cycle | AppState broadcast listener in HomeScreen |
| User interfaces | Tab navigation, animated cards, status banners |
| Data management | AsyncStorage for location logs and field notes |
| Memory management | Subscription and watcher cleanup on component unmount |
| Web services | OpenWeatherMap REST API with offline fallback |
| Background services | Background location task with foreground service notification |
| Local notifications | Pause, goal, and geofence trigger notifications |
| Maps & geofencing | react-native-maps with polyline and geofence detection |
| Deep links | Custom URL scheme with safe parameter handling |
| Offline-first design | Notes stored locally with manual sync and retry |
