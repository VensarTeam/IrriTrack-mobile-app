import { registerRootComponent } from 'expo';

import App from './App';
import {
  displayPushNotification,
  registerBackgroundNotificationHandler,
  registerNotifeeBackgroundEventHandler,
} from './src/services/pushNotificationService';

registerBackgroundNotificationHandler(async (remoteMessage) => {
  console.log('Background FCM message:', remoteMessage?.messageId || remoteMessage?.data);

  if (!remoteMessage?.notification) {
    await displayPushNotification(remoteMessage);
  }
});

registerNotifeeBackgroundEventHandler(async (remoteMessage) => {
  console.log('Background notification event:', remoteMessage?.messageId || remoteMessage?.data);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
