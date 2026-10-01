import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon, IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";
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

  const openModule = (module) => {
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
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back to projects"
        />
        <Text style={styles.headerTitle}>Project Modules</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#123B63", "#1D5A86"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.projectCard}
        >
          <View style={styles.projectGlow} />
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
        </LinearGradient>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>WORKSPACES</Text>
          <Text style={styles.sectionTitle}>Choose a module</Text>
          <Text style={styles.sectionSubtitle}>
            Select where you want to continue.
          </Text>
        </View>

        <View style={styles.moduleList}>
          {PROJECT_MODULES.map((module) => (
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
                style={styles.moduleCard}
              >
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
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProjectModulesScreen;
