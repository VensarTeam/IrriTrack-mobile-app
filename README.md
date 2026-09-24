# Vensar IrriTrack Mobile App

IrriTrack is an offline-first field operations application built with React Native and Expo. It helps field engineers, contractors, and project managers track irrigation projects, units, installation processes, checklists, photos, locations, and work progress from Android and iOS devices.

## Key Features

- Offline project, unit, contractor, work-status, and checklist data backed by SQLite
- Background synchronization when network connectivity is available
- Project, unit, process, subprocess, and checklist tracking
- Photo capture, image compression, gallery preview, and local draft storage
- GPS-based node and checklist location updates
- Mobile-number authentication, OTP/password recovery, face verification, and secure session storage
- Firebase Cloud Messaging and Notifee-based push notifications
- Role-aware screens, app update checks, and permission management
- React Native Paper UI with custom typography, icons, and application themes

## Tech Stack

- React Native `0.81.5`
- Expo SDK `54`
- React `19.1`
- React Navigation `7`
- React Native Paper
- SQLite (`react-native-sqlite-storage`)
- Axios
- React Native Firebase Messaging and Notifee
- Vision Camera and Expo Image Picker
- Expo Location, Media Library, Secure Store, and Local Authentication

This repository contains committed `android/` and `ios/` projects and uses native modules. Run it as a native development build; it is not compatible with Expo Go.

## Project Structure

```text
IrriTrack-mobile-app/
├── android/                 # Android native project
├── ios/                     # iOS native project
├── assets/                  # App icons and notification assets
├── docs/                    # Workflow and implementation documentation
├── packages/                # Local patched packages
├── src/
│   ├── assets/              # Application images, fonts, GIFs, and SVG icons
│   ├── components/          # Shared UI and application-level components
│   ├── config/              # Environment configuration
│   ├── constants/           # Theme, route, form, and application constants
│   ├── context/             # Authentication, alerts, and notification providers
│   ├── hooks/               # Shared React hooks
│   ├── models/              # Data models and transformers
│   ├── navigation/          # Root, authentication, tab, and drawer navigation
│   ├── repositories/        # Repository layer
│   ├── screens/             # Application screens
│   ├── services/            # API, storage, sync, media, and notification services
│   ├── utils/               # Shared utilities
│   └── viewmodels/          # Screen and workflow logic
├── App.js                   # Root application component
├── app.json                 # Expo application configuration
├── index.js                 # Native application entry point
└── package.json             # Dependencies and npm scripts
```

## Prerequisites

Install the following tools before running the application:

- Node.js `20.19.4` or newer
- npm
- JDK 17
- Android Studio, Android SDK, and an emulator or connected Android device
- macOS, Xcode, Xcode Command Line Tools, and CocoaPods for iOS development

A globally installed Expo CLI is not required. Use the project-local CLI through npm scripts or `npx expo`.

## Initial Setup

### 1. Clone the repository

```bash
git clone https://github.com/VensarTeam/IrriTrack-mobile-app.git
cd IrriTrack-mobile-app
```

### 2. Install JavaScript dependencies

```bash
npm install
```

The `postinstall` script automatically applies the repository's `patch-package` patches.

### 3. Configure environment variables

Obtain the development `.env` file from the project maintainer and place it in the repository root. The application expects API and image URLs under `EXPO_PUBLIC_*` variables.

Do not commit `.env`. Values with the `EXPO_PUBLIC_` prefix are bundled into the client application and must not contain passwords, private keys, or server-side secrets.

### 4. Verify Firebase configuration

The native projects expect these Firebase configuration files:

```text
android/app/google-services.json
ios/vensarOsmApp/GoogleService-Info.plist
```

Obtain the correct environment-specific files from the project maintainer if either file is missing.

### 5. Install iOS pods

Run this step on macOS before the first iOS build and whenever native dependencies change:

```bash
cd ios
pod install
cd ..
```

## Running the App

### Android

Start an Android emulator or connect a device with USB debugging enabled, then run:

```bash
npm run android
```

This executes `expo run:android` and builds the native Android development app.

### iOS

Start an iOS simulator or connect a configured iOS device, then run:

```bash
npm run ios
```

This executes `expo run:ios` and builds the native iOS development app. iOS builds require macOS and Xcode.

### Metro only

If the native app is already installed, start the development server with:

```bash
npm start
```

To clear the Metro cache:

```bash
npm start -- --clear
```

## Android Clean Build

Use this when Android native, CMake, NDK, or stale build-cache errors occur. Run the commands from the repository root:

```bash
rm -rf android/.cxx android/app/.cxx android/app/build android/build
cd android
./gradlew clean
cd ..
npm run android
```

The removal command is intentionally limited to generated Android build directories. Do not delete other files from the native project.

If Gradle reports that the wrapper is not executable, run this once:

```bash
chmod +x android/gradlew
```

## iOS Clean Build

For stale iOS build or pod-related errors, run from the repository root:

```bash
rm -rf ios/build
cd ios
pod install
cd ..
npm run ios
```

If pods still fail, update the local CocoaPods specs and retry according to the error output instead of deleting native project files.

## Useful npm Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start Expo Metro for the development client |
| `npm run android` | Build and run the Android native app |
| `npm run ios` | Build and run the iOS native app |
| `npm run web` | Start the Expo web target |

## Native Project Note

Do not run `npx expo prebuild` as a routine setup or cleanup command. The native Android and iOS projects are committed and contain project-specific configuration. Run prebuild only when intentionally regenerating native projects, after reviewing and backing up native changes.

When adding an Expo-compatible package, prefer:

```bash
npx expo install <package-name>
```

## Permissions

Depending on the workflow and platform, IrriTrack requests:

- Camera access for progress photos and face verification
- Photo/media-library access for selecting and saving images
- Foreground location access for location-aware updates
- Notification permission for operational alerts
- Face ID or device authentication for session protection

Permission status can be reviewed from the application's Permissions screen and from the device system settings.

## Troubleshooting

- Confirm the installed Node.js version with `node --version`.
- Confirm Android Debug Bridge can see the device with `adb devices`.
- Ensure Android SDK environment variables are configured by Android Studio.
- On iOS, rerun `pod install` after changing native dependencies.
- Use the clean-build commands above only when a normal build fails because of stale native output.
- Because the app uses native modules, use `npm run android` or `npm run ios` instead of Expo Go.

---

Built by Vensar for irrigation field operations.
