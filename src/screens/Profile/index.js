import React from "react";
import { Image, View, Text, TouchableOpacity, ScrollView } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";
import { APP_VERSION } from "../../constants/appInfo";
import useProfileViewModel from "../../viewmodels/useProfileViewModel";

const ProfileScreen = ({ navigation }) => {
  const { user, initials, handleLogout } = useProfileViewModel(navigation);
  const isActiveUser = user.isActive === true;
  const designation = user.designation || "No designation";

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
        <View style={styles.avatarWrap}>
          <View style={styles.avatarBorder}>
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
          </View>

          {isActiveUser ? <View style={styles.activeDot} /> : null}
        </View>

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
          <Text style={styles.designationText} numberOfLines={1}>
            {designation}
          </Text>
        </LinearGradient>

        <View style={styles.infoCard}>
          <InfoRow icon="cellphone" label="Mobile" value={user.mobile} />
          <InfoRow icon="email-outline" label="Email" value={user.email} />
          <InfoRow
            icon="briefcase-outline"
            label="Designation"
            value={user.designation}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon source="logout-variant" size={21} color={colors.white} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>App Version {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoIconWrap}>
      <Icon source={icon} size={19} color={colors.navyFresh} />
    </View>

    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "-"}
      </Text>
    </View>
  </View>
);
