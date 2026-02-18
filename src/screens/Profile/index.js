import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import styles from "./styles";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";

const ProfileScreen = ({ navigation }) => {
  const user = {
    name: "Ritesh Mehra",
    mobile: "9876543210",
    email: "ritesh.mehra@wms.in",
    designation: "Site Engineer",
  };

  const initials = user.name.split(" ")[0][0] + user.name.split(" ")[1][0];

  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: ROUTES.ROOT.AUTH_STACK }],
            });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* HEADER */}
      <LinearGradient
        colors={[colors.appHeaderStart, colors.appHeaderEnd]}
        style={styles.header}
      >
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>

        <Text style={styles.name}>{user.name}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user.designation}</Text>
        </View>
      </LinearGradient>

      {/* DETAILS SECTION */}
      <View style={styles.detailsContainer}>
        <InfoRow label="Mobile" value={user.mobile} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Designation" value={user.designation} />

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version 1.0.0</Text>
      </View>
    </View>
  );
};

export default ProfileScreen;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);
