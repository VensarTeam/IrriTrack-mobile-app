# Firebase Push Notification Setup

This app is wired for Firebase Cloud Messaging through React Native Firebase:

- Android package name: `com.vensar.irritrack`
- iOS bundle identifier: `org.vensar.irritrack`
- Android config file path: `android/app/google-services.json`
- iOS config file path: `GoogleService-Info.plist`

## Firebase Console Checklist

Create or open the Firebase project, then add the mobile apps below.

### Android App

Required values:

- Android package name: `com.vensar.irritrack`
- App nickname: `IrriTrack Android`
- Debug SHA-1 certificate fingerprint
- Debug SHA-256 certificate fingerprint
- Release SHA-1 certificate fingerprint
- Release SHA-256 certificate fingerprint
- `google-services.json`

Get debug fingerprints:

```sh
cd android
./gradlew signingReport
```

The React Native Firebase docs recommend adding the `debugAndroidTest` SHA-1 and SHA-256 values for debug builds. For production builds, add the fingerprints from the release upload/signing key used by Play Console or your release keystore.

After registration, download `google-services.json` and place it here:

```text
android/app/google-services.json
```

### iOS App

Required values:

- iOS bundle ID: `org.vensar.irritrack`
- App nickname: `IrriTrack iOS`
- App Store ID, optional until the app is on App Store Connect
- `GoogleService-Info.plist`
- Apple Push Notification service key from Apple Developer
- APNs key ID
- Apple Team ID
- APNs auth key file, for example `AuthKey_XXXXXXXXXX.p8`

After registration, download `GoogleService-Info.plist` and add it to the iOS target in Xcode. Also keep a copy at:

```text
GoogleService-Info.plist
```

Enable Push Notifications capability in Xcode for the iOS target. Background remote notifications are already configured in `Info.plist`.

## Backend Checklist

Your backend should store one or more FCM tokens per user/device.

Send the app token from:

```text
src/components/PushNotificationBootstrap.js
```

Replace the `TODO` in `handleToken` with the API call once the endpoint is ready. Recommended payload:

```json
{
  "fcmToken": "device-token-from-app",
  "platform": "android-or-ios",
  "appVersion": "1.0",
  "deviceId": "optional-stable-device-id"
}
```

## Local Build Steps

Install dependencies:

```sh
npm install
```

Android:

```sh
npx expo run:android
```

iOS:

```sh
cd ios
pod install
cd ..
npx expo run:ios
```

React Native Firebase uses native code, so Expo Go will not work for these notifications. Use a development build or release build.

## Test Payload

Use Firebase Console notification composer for a first smoke test. For backend/API tests, send a message with both `notification` and `data` payloads:

```json
{
  "notification": {
    "title": "IrriTrack",
    "body": "Test notification received."
  },
  "data": {
    "type": "test",
    "screen": "dashboard"
  }
}
```

Behavior:

- Foreground: app shows an in-app alert.
- Background or killed: OS shows the notification when the payload includes `notification`.
- Token refresh: app calls the same token callback again.
- Permission denied: app shows an alert with an option to open system settings.
