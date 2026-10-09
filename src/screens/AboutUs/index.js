import React from "react";
import { View, Text, ScrollView, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientScreenHeader from "../../components/GradientScreenHeader";
import styles from "./styles";
import useAboutUsViewModel from "../../viewmodels/useAboutUsViewModel";

const AboutScreen = () => {
  const { sections } = useAboutUsViewModel();

  return (
    <SafeAreaView
      style={[styles.screen, Platform.OS === "ios" && styles.iosScreen]}
      edges={Platform.OS === "ios" ? ["top"] : []}
    >
      <GradientScreenHeader>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerTitle}>About Us</Text>
        </View>
      </GradientScreenHeader>

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
    </SafeAreaView>
  );
};

export default AboutScreen;

const SectionCard = ({ title, content }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardText}>{content}</Text>
  </View>
);
