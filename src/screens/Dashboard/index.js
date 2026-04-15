import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useDashboardViewModel from "../../viewmodels/useDashboardViewModel";
import { Icon } from "react-native-paper";
import { APP_NAME, PROJECT_FULL_FORM } from "../../constants/appInfo";
import { Icons } from "../../constants/icons";

const DashboardScreen = ({ navigation }) => {
  const {
    filteredProjects,
    searchQuery,
    openProject,
    handleLogout,
    setSearchQuery,
    clearSearch,
  } = useDashboardViewModel(navigation);

  return (
    <LinearGradient
      colors={[
        colors.loginHeroGradientStart,
        colors.loginHeroGradientMid,
        colors.loginHeroGradientEnd,
        colors.loginPageGradientMid,
        colors.loginPageGradientEnd,
      ]}
      locations={[0, 0.2, 0.42, 0.72, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.logoutIconButton}
          onPress={handleLogout}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <Icons.logout height={24} width={24} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headerTitle}>{APP_NAME}</Text>
        <Text style={styles.headerFullForm}>{PROJECT_FULL_FORM}</Text>
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionHeadRow}>
            <View>
              <Text style={styles.sectionTitle}>Active Projects</Text>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <Icon source="magnify" size={21} color={colors.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search project or client"
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearSearchButton}
                onPress={clearSearch}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Clear project search"
              >
                <Icon source="close" size={18} color={colors.navyFreshDark} />
              </TouchableOpacity>
            ) : null}
          </View>

          {filteredProjects.map((item) => (
            <ProjectCard key={item.id} item={item} onPress={openProject} />
          ))}

          {filteredProjects.length === 0 ? (
            <View style={styles.emptySearchCard}>
              <Icon source="map-search-outline" size={30} color={colors.primaryBlue} />
              <Text style={styles.emptySearchTitle}>No projects found</Text>
              <Text style={styles.emptySearchText}>
                Try searching by project name or client.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </LinearGradient>
  );
};

export default DashboardScreen;

const ProjectCard = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.cardShadow}
      onPress={() => onPress(item)}
    >
      <LinearGradient
        colors={["#fcfeff", "#def5fb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/images/gov_logo.png")}
                style={styles.govLogo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.titleGroup}>
              <Text style={styles.projectName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBottom}>
          <View style={styles.areaContainer}>
            <Text style={styles.areaLabel}>Project Area</Text>
            <Text style={styles.areaValue}>{item.area}</Text>
          </View>

          <View style={styles.arrowContainer}>
            <Icon source="chevron-right" size={18} color={colors.white} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
