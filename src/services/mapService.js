import { Alert, Linking } from "react-native";

export const openDirections = async (latitude, longitude) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Unable to open map", "Please check map availability on your device.");
  }
};

export const openLocation = async (latitude, longitude) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert("Unable to open map", "Please check map availability on your device.");
  }
};
