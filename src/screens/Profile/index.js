import React from "react";
import { Image, View, Text, TouchableOpacity, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import { APP_VERSION } from "../../constants/appInfo";
import useProfileViewModel from "../../viewmodels/useProfileViewModel";
import { Icons } from "../../constants/icons";

const ProfileScreen = ({ navigation }) => {
  const { user, initials, handleLogout } = useProfileViewModel(navigation);
  const isActiveUser = user.isActive === true;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[
          colors.loginHeroGradientStart,
          colors.loginHeroGradientMid,
          colors.loginHeroGradientEnd,
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.bodyWrapper}
        contentContainerStyle={styles.detailsContainer}
        showsVerticalScrollIndicator={false}
      >
        {user.profileUrl ? (
          <Image
            source={{ uri: user.profileUrl }}
            style={styles.avatarImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        <Text style={styles.name}>{user.name || "User"}</Text>

        <LinearGradient
          colors={[
            "rgba(255,255,255,0.78)",
            "rgba(234,243,255,0.62)",
            "rgba(255,255,255,0.84)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.designationPill}
        >
          {isActiveUser ? <View style={styles.designationDot} /> : null}
          <Text style={styles.designationText}>
            {user.designation || "Null"}
          </Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <InfoRow label="Mobile" value={user.mobile} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Designation" value={user.designation} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icons.logout height={22} width={22} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || "-"}</Text>
  </View>
);
