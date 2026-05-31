# Nearby Weather Explorer

A mobile application built with React Native and Expo for SOFT 211 — Mobile Application Development.

## Description

Nearby Weather Explorer is a location-aware weather app that tracks your current position and fetches real-time weather data for wherever you are. The app runs location updates in the background, listens for network and app-state changes, and presents weather information through a clean animated interface.

## Features

### Location & Background Services
- Requests foreground and background location permissions
- Tracks your GPS position in real time using `expo-location`
- Runs a background location task via `expo-task-manager` that continues updating even when the app is minimized
- Displays current coordinates and accuracy, plus a scrollable history of recent positions

### Broadcast Intents & External API
- Listens for network connectivity changes using `expo-network` and shows an offline banner when no connection is detected
- Listens for app foreground/background state changes using React Native's `AppState`
- Fetches live weather data from the **OpenWeatherMap API** (temperature, feels-like, humidity, conditions) using your current GPS coordinates
- Displays current network type and app state in the UI

### User Interface & Animation
- Animated sliding tab bar to switch between the Home view and Location History view
- Weather card fades and slides in each time new data loads (Reanimated `withTiming`)
- Refresh button animates with a spring press effect (`withSpring`)
- Emoji weather icons that match current conditions (☀️ ☁️ 🌧️ ❄️ ⛈️)
- Offline banner with clear messaging when internet is unavailable

## Libraries Used

| Library | Purpose |
|---|---|
| `expo-location` | GPS tracking, foreground & background location |
| `expo-task-manager` | Background task registration |
| `expo-network` | Network state and connectivity listener |
| `react-native-reanimated` | Smooth animations and transitions |

## External API

**OpenWeatherMap** — Current Weather Data API  
Endpoint: `https://api.openweathermap.org/data/2.5/weather`  
Free tier — no account required beyond a free API key.

## Setup

1. Clone the repository
2. Run `npm install`
3. Add your OpenWeatherMap API key in `screens/HomeScreen.js` line 8
4. Run `npx expo start` and scan the QR code with the Expo Go app

## Course Outcomes Addressed

- Application life cycle (AppState broadcast listener)
- User interfaces (animated tab navigation, weather cards)
- Data management (location history, cached weather)
- Web services (OpenWeatherMap REST API)
- Memory management (subscription cleanup on unmount)
