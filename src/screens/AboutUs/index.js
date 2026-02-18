import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";
import useAboutUsViewModel from "../../viewmodels/useAboutUsViewModel";

const AboutScreen = () => {
  const { sections } = useAboutUsViewModel();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={[colors.white, colors.white]} style={styles.header}>
        <View style={styles.logoWrap}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.headerTitle}>About Us</Text>
      </LinearGradient>

      <View style={styles.bodyWrapper}>
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
