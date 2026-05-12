import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  AppState,
} from "react-native";
import { Icon, Switch } from "react-native-paper";
import { Camera } from "react-native-vision-camera";
import * as Location from "expo-location";
import * as MediaLibrary from "expo-media-library";
import { requestPushNotificationPermission, checkPushNotificationPermission } from "../../services/pushNotificationService";
import { showAppAlert } from "../../services/alertService";
import styles from "./styles";
import colors from "../../constants/colors";

const PermissionsSettingsScreen = ({ navigation }) => {
  const [permissions, setPermissions] = useState([
    {
      id: "camera",
      title: "Camera",
      description: "For barcode scanning & unit photos.",
      icon: "camera-outline",
      status: "undetermined", // granted, denied, undetermined
    },
    {
      id: "location",
      title: "Location",
      description: "To tag exact coordinates for updates.",
      icon: "map-marker-outline",
      status: "undetermined",
    },
    {
      id: "media",
      title: "Media Library",
      description: "To save unit photos to your gallery.",
      icon: "image-outline",
      status: "undetermined",
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "To receive important server alerts.",
      icon: "bell-outline",
      status: "undetermined",
    },
  ]);

  const checkPermissions = useCallback(async () => {
    try {
      const cameraStatus = await Camera.getCameraPermissionStatus();
      const locationStatus = await Location.getForegroundPermissionsAsync();
      const mediaStatus = await MediaLibrary.getPermissionsAsync();
      const notifStatus = await checkPushNotificationPermission();

      setPermissions((prev) =>
        prev.map((p) => {
          if (p.id === "camera") {
            return { ...p, status: cameraStatus === "granted" ? "granted" : "denied" };
          }
          if (p.id === "location") {
            return { ...p, status: locationStatus.granted ? "granted" : "denied" };
          }
          if (p.id === "media") {
            return { ...p, status: mediaStatus.granted ? "granted" : "denied" };
          }
          if (p.id === "notifications") {
            return { ...p, status: notifStatus ? "granted" : "denied" };
          }
          return p;
        })
      );
    } catch (error) {
      console.warn("Failed to check permissions", error);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  const handleTogglePermission = async (id, currentStatus) => {
    // If trying to disable, prompt to go to settings as we can't programmatically revoke
    if (currentStatus === "granted") {
      showAppAlert({
        title: "Revoke Permission",
        message: "You can disable this permission from your device's Settings.",
        confirmText: "Open Settings",
        cancelText: "Cancel",
        onConfirm: () => {
          Linking.openSettings();
        },
      });
      return;
    }

    // Request permission
    try {
      if (id === "camera") {
        const newCameraStatus = await Camera.requestCameraPermission();
        if (newCameraStatus === "denied") {
          Linking.openSettings();
        } else {
          checkPermissions();
        }
      } else if (id === "location") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Linking.openSettings();
        } else {
          checkPermissions();
        }
      } else if (id === "media") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Linking.openSettings();
        } else {
          checkPermissions();
        }
      } else if (id === "notifications") {
        const granted = await requestPushNotificationPermission();
        setPermissions((prev) =>
          prev.map((p) =>
            p.id === "notifications"
              ? { ...p, status: granted ? "granted" : "denied" }
              : p
          )
        );
        if (!granted) {
          Linking.openSettings();
        }
      }
    } catch (error) {
      console.warn("Error requesting permission", error);
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon source="arrow-left" size={20} color={colors.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>App Permissions</Text>
            <Text style={styles.headerSubtitle}>Enable features for IrriTrack</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {permissions.map((item) => {
          const isGranted = item.status === "granted";
          
          return (
            <View key={item.id} style={styles.permissionCard}>
              <View style={[styles.iconContainer, isGranted && { backgroundColor: colors.primaryGreen + "15" }]}>
                <Icon 
                  source={item.icon} 
                  size={24} 
                  color={isGranted ? colors.primaryGreen : colors.primaryBlue} 
                />
              </View>
              
              <View style={styles.textContainer}>
                <Text style={styles.permissionTitle}>{item.title}</Text>
                <Text style={styles.permissionDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>

              <View style={styles.switchContainer}>
                <Switch
                  value={isGranted}
                  onValueChange={() => handleTogglePermission(item.id, item.status)}
                  color={colors.primaryGreen}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default PermissionsSettingsScreen;
