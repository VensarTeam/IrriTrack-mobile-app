import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  RefreshControl,
} from "react-native";
import styles from "./styles";
import colors from "../../constants/colors";
import GradientScreenHeader from "../../components/GradientScreenHeader";
import useDashboardViewModel from "../../viewmodels/useDashboardViewModel";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

const DashboardScreen = ({ navigation }) => {
  const {
    filteredProjects,
    isProjectListLoading,
    isAuthorizationReady,
    searchQuery,
    isRefreshingProjects,
    refreshProjects,
    openProject,
    handleLogout,
    setSearchQuery,
    clearSearch,
  } = useDashboardViewModel(navigation);

  return (
    <SafeAreaView
      style={[styles.screen, Platform.OS === "ios" && styles.iosScreen]}
      edges={Platform.OS === "ios" ? ["top"] : []}
    >
      <GradientScreenHeader>
        <View style={styles.headerTopRow}>
          <View style={styles.logoWrap}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {Platform.OS === "ios" ? "Dashboard" : "IRRITRACK DASHBOARD"}
          </Text>

          <TouchableOpacity
            style={styles.logoutIconButton}
            onPress={handleLogout}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <Icon source="logout" size={25} color={colors.navyFreshDark} />
          </TouchableOpacity>
        </View>
      </GradientScreenHeader>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingProjects}
              onRefresh={refreshProjects}
              colors={[colors.primaryGreen]}
              tintColor={colors.primaryGreen}
            />
          }
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
              <Text style={styles.emptySearchTitle}>
                {!isAuthorizationReady
                  ? "Project access unavailable"
                  : isProjectListLoading
                    ? "Loading projects"
                    : "No projects found"}
              </Text>
              <Text style={styles.emptySearchText}>
                {!isAuthorizationReady
                  ? "Connect and pull down to refresh your permissions."
                  : isProjectListLoading
                    ? "Checking your saved projects."
                    : searchQuery
                      ? "Try searching by project name or client."
                      : "No projects are assigned to your account."}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
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
      <View style={styles.card}>
        <View style={styles.cardTop}>
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
            <Text style={styles.projectClient} numberOfLines={1}>
              {item.client}
            </Text>
          </View>

          <View style={styles.arrowContainer}>
            <Icon source="chevron-right" size={19} color={colors.primaryBlue} />
          </View>
        </View>

        <View style={styles.areaRow}>
          <Icon
            source="map-marker-radius-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={styles.areaLabel}>Area</Text>
          <Text style={styles.areaValue} numberOfLines={1}>
            {item.area}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
