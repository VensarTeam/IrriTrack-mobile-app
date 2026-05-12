# Vensar IrriTrack App

**IrriTrack** is a comprehensive, offline-first mobile application built with React Native and Expo. It is designed to help field engineers, contractors, and project managers seamlessly track, update, and manage irrigation and construction project workflows directly from the field.

## 🚀 Key Features

*   **Offline-First Architecture**: Built with local SQLite storage to allow seamless data collection and checklist submission even in remote areas without internet connectivity. Data is securely synced to the server once connectivity is restored.
*   **Unit & Subprocess Tracking**: Manage complex project hierarchies (Projects -> Units -> Processes -> Subprocesses) with detailed checklists and dynamic form fields.
*   **Media Collection & Management**: Capture high-quality progress photos using `react-native-vision-camera`. Images are automatically compressed and can be optionally saved directly to the device gallery.
*   **Location Tagging**: Integrates with GPS to enforce location-aware updates, ensuring data integrity by tying checklist submissions to precise geographic coordinates.
*   **Secure Authentication**: Features mobile number login with Face Verification and session state management.
*   **Real-time Push Notifications**: Powered by Firebase Cloud Messaging (FCM) to keep the workforce informed about important alerts and synchronization updates.
*   **Dynamic UI & Product-Level UX**: Utilizing `react-native-paper`, custom typography, and modern aesthetics (glassmorphism, gradients) for an intuitive and premium user experience.

## 🛠️ Tech Stack

*   **Framework**: [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/) (Managed/Custom Workflow)
*   **Navigation**: React Navigation (Stack, Bottom Tabs, Drawer)
*   **State Management / Architecture**: MVVM Pattern (Context API, Custom Hooks, Repositories, Services)
*   **Local Database**: `react-native-sqlite-storage`
*   **UI Components**: `react-native-paper`, `react-native-linear-gradient`, `react-native-vector-icons`
*   **Media & Camera**: `react-native-vision-camera`, `expo-image-picker`, `expo-media-library`
*   **Location Services**: `expo-location`
*   **Notifications**: `@react-native-firebase/messaging`

## 📂 Project Structure

```
vensarwmsapp/
├── assets/                 # Static images, fonts, and icons
├── src/
│   ├── components/         # Reusable UI components (Buttons, Modals, Forms)
│   ├── config/             # Environment variables and global configurations
│   ├── constants/          # Theme colors, fonts, routing constants
│   ├── context/            # React Contexts (AuthContext, AppAlertProvider)
│   ├── hooks/              # Custom React hooks
│   ├── models/             # Data models and transformers
│   ├── navigation/         # Navigators (Root, Auth, Tabs)
│   ├── repositories/       # Local SQLite database interactions
│   ├── screens/            # Application screens (Dashboard, Profile, Unit, etc.)
│   ├── services/           # External API calls, Background sync, Push Notifications
│   └── viewmodels/         # Logic layer bridging screens and services/repositories
├── App.js                  # Application entry point
├── app.json                # Expo configuration and plugins
└── package.json            # Project dependencies and scripts
```

## ⚙️ Getting Started

### Prerequisites

*   **Node.js**: v18.x or higher
*   **npm** or **yarn**
*   **Expo CLI**: Installed globally
*   **EAS CLI**: (Optional) For building native binaries

### Installation

1.  **Clone the repository** (if you haven't already):
    ```bash
    git clone <repository-url>
    cd vensarwmsapp
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run prebuild (if necessary)** to generate native Android/iOS folders based on Expo plugins:
    ```bash
    npx expo prebuild
    ```

### Running the App Locally

Start the Expo development server:

```bash
npm start
# or
npx expo start --dev-client
```

*   **Android**: Press `a` in the terminal to open the app on an Android emulator or connected device.
*   **iOS**: Press `i` in the terminal to open the app on an iOS simulator.

> **Note**: Since this app uses native modules like `react-native-vision-camera` and `@react-native-firebase/messaging`, it must be run using a custom development client (Dev Client) rather than the standard Expo Go app.

## 🔐 Permissions Overview

The app respectfully requests the following device permissions to function optimally:
*   **Camera**: For capturing unit progress photos, scanning barcodes, and face verification.
*   **Location (Foreground)**: To record coordinates when submitting checklists.
*   **Media Library**: To allow saving captured photos to the local device gallery.
*   **Notifications**: To receive critical alerts from the server.

All permissions are managed through a dedicated `Permissions Settings` screen, offering users complete control.

---
*Built with ❤️ for field engineering and management.*