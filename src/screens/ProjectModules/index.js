import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";
import { useAuth } from "../../context/AuthContext";
import { isProjectAllowed } from "../../services/authPermissions";
import { syncOmsBasicUnitsForProjectInBackground } from "../../services/omsOfflineStore";
import styles from "./styles";

const PROJECT_MODULES = [
  {
    key: "omsRms",
    title: "OMS / RMS",
    description: "Outlet and regulating system progress",
    icon: "pipe-valve",
    color: "#255B8E",
    gradient: ["#E9F3FC", "#F8FBFF"],
    border: "#C9DDF0",
  },
  {
    key: "pipeNetwork",
    title: "Pipe Network",
    description: "Laying, excavation and backfilling",
    icon: "pipe",
    color: "#0B7C96",
    gradient: ["#E7F7FA", "#F8FDFE"],
    border: "#C5E7ED",
  },
];

const ProjectModulesScreen = ({ navigation, route }) => {
  const project = route?.params?.project || {};
  const projectName = route?.params?.projectName || project?.name || "Project";
  const { authorization, roleAccess } = useAuth();
  const hasProjectAccess =
    roleAccess.isAuthorizationReady && isProjectAllowed(authorization, project);
  const visibleModules = hasProjectAccess
    ? PROJECT_MODULES.filter((module) =>
        module.key === "omsRms"
          ? roleAccess.canViewOms
          : roleAccess.canViewPipeLaying
      )
    : [];

  const openModule = (module) => {
    if (!hasProjectAccess || !visibleModules.some((item) => item.key === module.key)) {
      return;
    }
    if (module.key === "omsRms") {
      const projectId = project?.id || project?.projectId || "";
      void syncOmsBasicUnitsForProjectInBackground(projectId);
    }

    navigation.navigate(ROUTES.ROOT.PROJECT_DETAILS, {
      project,
      projectName,
      selectedModule: module.key,
      selectedModuleTitle: module.title,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, Platform.OS === "ios" && styles.iosHeader]}>
        <IconButton
          icon="arrow-left"
          size={24}
          style={Platform.OS === "ios" ? styles.iosBackButton : undefined}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to projects"
        />
        <Text style={[styles.headerTitle, Platform.OS === "ios" && styles.iosHeaderTitle]}>Project Modules</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "never" : "automatic"}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.projectCard}>
          <LinearGradient
            colors={["#123B63", "#1D5A86"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={styles.projectCardGradient}
          />
          <View pointerEvents="none" style={styles.projectGlow} />
          <View style={styles.projectCardContent}>
            <View style={styles.projectIcon}>
              <Icon source="domain" size={23} color={colors.white} />
            </View>
            <View style={styles.projectCopy}>
              <Text style={styles.projectEyebrow}>CURRENT PROJECT</Text>
              <Text selectable style={styles.projectName} numberOfLines={2}>
                {projectName}
              </Text>
              {project?.area ? (
                <View style={styles.projectMetaRow}>
                  <Icon source="map-marker-outline" size={14} color="#C6DDEE" />
                  <Text selectable style={styles.projectMeta} numberOfLines={1}>
                    {project.area}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>WORKSPACES</Text>
          <Text style={styles.sectionTitle}>Choose a module</Text>
          <Text style={styles.sectionSubtitle}>
            Select where you want to continue.
          </Text>
        </View>

        <View style={styles.moduleList}>
          {visibleModules.map((module) => (
            <Pressable
              key={module.key}
              onPress={() => openModule(module)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${module.title} dashboard`}
              style={({ pressed }) => [
                styles.moduleCardShell,
                { borderColor: module.border },
                pressed && styles.moduleCardPressed,
              ]}
            >
              <LinearGradient
                colors={module.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                pointerEvents="none"
                style={styles.moduleCardGradient}
              />
              <View style={styles.moduleCard}>
                <View
                  style={[styles.moduleAccent, { backgroundColor: module.color }]}
                />
                <View style={[styles.moduleIcon, { borderColor: module.border }]}>
                  <Icon source={module.icon} size={25} color={module.color} />
                </View>

                <View style={styles.moduleCopy}>
                  <Text style={[styles.moduleTitle, { color: module.color }]} numberOfLines={1}>
                    {module.title}
                  </Text>
                  <Text style={styles.moduleDescription} numberOfLines={2}>
                    {module.description}
                  </Text>
                </View>

                <View style={[styles.moduleArrow, { backgroundColor: module.color }]}>
                  <Icon source="chevron-right" size={19} color={colors.white} />
                </View>
              </View>
            </Pressable>
          ))}
          {visibleModules.length === 0 ? (
            <View style={[styles.moduleCardShell, { padding: 20, borderColor: colors.cardBorder }]}>
              <Text style={styles.moduleTitle}>No available modules</Text>
              <Text style={styles.moduleDescription}>
                {hasProjectAccess
                  ? "Your account does not have OMS/RMS or Pipe Network access."
                  : "Project access is unavailable. Connect and refresh your permissions."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProjectModulesScreen;
