import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useAboutUsViewModel from "../../viewmodels/useAboutUsViewModel";

const AboutScreen = () => {
  const { sections } = useAboutUsViewModel();

  return (
    <LinearGradient
      colors={[colors.vibrantGradientTop, colors.vibrantGradientMid, colors.vibrantGradientBlend]}
      locations={[0, 0.42, 1]}
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

        <Text style={styles.headerTitle}>About Us</Text>
      </View>

      <LinearGradient
        colors={[colors.vibrantGradientBlend, colors.loginBottomLight, colors.white]}
        locations={[0, 0.56, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bodyWrapper}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {sections.map((section) => (
            <SectionCard
              key={section.title}
              title={section.title}
              content={section.content}
            />
          ))}
        </ScrollView>
      </LinearGradient>
    </LinearGradient>
  );
};

export default AboutScreen;

const SectionCard = ({ title, content }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{content}</Text>
  </View>
);
