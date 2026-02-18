import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import styles from "./styles";
import colors from "../../constants/colors";

const AboutScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.white, colors.white]}
        style={styles.header}
      >
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
          <SectionCard
            title="Vensar Constructions Company"
            content={"Vensar Constructions Company is promoted by qualified, experienced and dedicated professionals committed to innovation and excellence in every project. We have earned high accolades for competence, dedication and quality - delivering services on time and at competitive prices."}
          />

          <SectionCard
            title="Core Expertise"
            content={"We specialize in Infrastructure development, including Buildings, Tunnelling, Roads and Electrical Lines. Our extensive market knowledge and project experience have established us as a major industry player."}
          />

          <SectionCard
            title="Project Portfolio"
            content={"We undertake projects ranging from small private developments to large Government initiatives. Our flexible project management systems ensure successful outcomes regardless of project size or complexity."}
          />

          <SectionCard
            title="Our Vision"
            content={"We are dedicated to responsible construction practices that promote long-term value and community well-being. We ensure project delivery on time, on budget and within tender cost commitments, while maintaining strict safety and environmental standards."}
          />

          <SectionCard
            title="Quality & Certification"
            content={"We are ISO 9001:2008 certified and committed to robust quality assurance programs. Among the first in India to deploy ERP across all locations, our strong team of engineers ensures customer expectations are consistently exceeded."}
          />
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
