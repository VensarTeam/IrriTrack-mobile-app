import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useAboutUsViewModel from "../../viewmodels/useAboutUsViewModel";

const AboutScreen = () => {
  const { sections } = useAboutUsViewModel();

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
          <Text style={styles.headerTitle}>About Us</Text>
        </View>
      </LinearGradient>

      <View style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoCard}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {sections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              content={section.content}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default AboutScreen;

const SectionCard = ({ title, content }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{content}</Text>
  </View>
);
