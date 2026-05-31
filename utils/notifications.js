import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleNotification(title, body) {
  // Fire the notification
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: null,
  });

  // Haptic feedback — heavy impact for alerts
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

  // Speak the body text aloud
  Speech.speak(body, { language: 'en', pitch: 1.0, rate: 0.9 });
}

export async function triggerHaptic(type = 'success') {
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  };
  await Haptics.notificationAsync(map[type] ?? map.success);
}
