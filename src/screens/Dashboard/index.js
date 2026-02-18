import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import { ROUTES } from "../../navigation/routes";

const projects = [
  {
    id: 1,
    client: "Government of Madhya Pradesh",
    name: "Kayampur Sitamau P.M.I.P",
    area: "112124 Ha",
  },
];

const DashboardScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.white, colors.surfaceBluePale]}
        style={styles.header}
      >
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headerTitle}>Water Management System</Text>
      </LinearGradient>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Active Projects</Text>

          {projects.map((item) => (
            <ProjectCard key={item.id} item={item} navigation={navigation} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default DashboardScreen;

const ProjectCard = ({ item, navigation }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate(ROUTES.ROOT.PROJECT_DETAILS)}
    >
      <View style={styles.cardTop}>
        <Image
          source={require("../../assets/images/gov_logo.png")}
          style={styles.govLogo}
          resizeMode="contain"
        />

        <Text style={styles.clientText}>{item.client}</Text>
      </View>

      <Text style={styles.projectName}>{item.name}</Text>

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.areaLabel}>TOTAL AREA</Text>

          <Text style={styles.areaValue}>{item.area}</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
};
