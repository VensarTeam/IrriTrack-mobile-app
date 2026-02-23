import { Linking } from "react-native";
import { showAppAlert } from "./alertService";

const MAP_ERROR_CONFIG = {
  type: "warning",
  title: "Unable to open map",
  message: "Please check map availability on your device.",
};

export const openDirections = async (latitude, longitude) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    showAppAlert(MAP_ERROR_CONFIG);
  }
};

export const openLocation = async (latitude, longitude) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  try {
    await Linking.openURL(url);
  } catch (error) {
    showAppAlert(MAP_ERROR_CONFIG);
  }
};
