import * as TaskManager from 'expo-task-manager';
import HomeScreen from './screens/HomeScreen';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

// Must be defined at module level before any component renders
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    console.log('Background location update:', locations);
  }
});

export default function App() {
  return <HomeScreen />;
}
