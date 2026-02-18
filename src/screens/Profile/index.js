import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useProfileViewModel from "../../viewmodels/useProfileViewModel";

const ProfileScreen = ({ navigation }) => {
  const { user, initials, handleLogout } = useProfileViewModel(navigation);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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

      <View style={styles.detailsContainer}>
        <InfoRow label="Mobile" value={user.mobile} />
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Designation" value={user.designation} />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
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
