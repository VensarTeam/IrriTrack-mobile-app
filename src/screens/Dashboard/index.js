import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useDashboardViewModel from "../../viewmodels/useDashboardViewModel";
import { Icon } from "react-native-paper";

const DashboardScreen = ({ navigation }) => {
  const { projects, openProject } = useDashboardViewModel(navigation);

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
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headerTitle}>Project Management Tools</Text>
      </View>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Active Projects</Text>

          {projects.map((item) => (
            <ProjectCard key={item.id} item={item} onPress={openProject} />
          ))}
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
        colors={["#FCFFFD", "#EAF8EF"]}
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
