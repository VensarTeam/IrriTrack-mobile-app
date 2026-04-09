import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const RING_SIZE = moderateScale(212);
const RING_STROKE = moderateScale(8);
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const splashPalette = {
  gradientStart: "#F7FBFF",
  gradientMid: colors.tabShellBg,
  gradientEnd: "#FDFEFF",
  glow: "#CFE7FB",
  ringTrack: "rgba(94,168,232,0.18)",
  ringProgress: "#11436f",
  shell: "rgba(255,255,255,0.88)",
  shadow: "#194a74",
  frameBorder: "rgba(94,168,232,0.12)",
  logoGradientStart: "rgba(255,255,255,0.98)",
  logoGradientMid: "#F2F8FF",
  logoGradientEnd: "#EBF6FF",
  title: "#154A8A",
  subtitle: "#5D7FA8",
};

const AndroidSplash = ({ onLayout }) => {
  const logoScale = useRef(new Animated.Value(1.18)).current;
  const contentOpacity = useRef(new Animated.Value(0.18)).current;
  const contentTranslateY = useRef(new Animated.Value(18)).current;
  const glowOpacity = useRef(new Animated.Value(0.14)).current;
  const ringProgress = useRef(new Animated.Value(RING_CIRCUMFERENCE)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 0.26,
        duration: 900,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(ringProgress, {
        toValue: 0,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [contentOpacity, contentTranslateY, glowOpacity, logoScale, ringProgress]);

  return (
    <View style={styles.container} onLayout={onLayout}>
      <LinearGradient
        colors={[
          splashPalette.gradientStart,
          splashPalette.gradientMid,
          splashPalette.gradientEnd,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />
        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={splashPalette.ringTrack}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={splashPalette.ringProgress}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
                strokeDashoffset={ringProgress}
                rotation="-90"
                originX={RING_SIZE / 2}
                originY={RING_SIZE / 2}
              />
            </Svg>

            <Animated.View
              style={[
                styles.logoShell,
                {
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  splashPalette.logoGradientStart,
                  splashPalette.logoGradientMid,
                  splashPalette.logoGradientEnd,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoFrame}
              >
                <Image
                  source={require("../assets/images/logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Animated.View>
          </View>

          <View style={styles.copyWrap}>
            <Text style={styles.title}>Project Management Tools</Text>
            <Text style={styles.subtitle}>Secure workspace loading</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

export default AndroidSplash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(24),
  },

  glow: {
    position: "absolute",
    width: moderateScale(244),
    height: moderateScale(244),
    borderRadius: moderateScale(122),
    backgroundColor: splashPalette.glow,
  },

  content: {
    alignItems: "center",
    justifyContent: "center",
  },

  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  ringSvg: {
    position: "absolute",
  },

  logoShell: {
    width: moderateScale(136),
    height: moderateScale(136),
    borderRadius: moderateScale(68),
    backgroundColor: splashPalette.shell,
    shadowColor: splashPalette.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
    padding: moderateScale(8),
  },

  logoFrame: {
    flex: 1,
    borderRadius: moderateScale(60),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: splashPalette.frameBorder,
  },

  logo: {
    width: "68%",
    height: "68%",
  },

  copyWrap: {
    marginTop: verticalScale(18),
    alignItems: "center",
  },

  title: {
    fontSize: moderateScale(22),
    fontFamily: fonts.bold,
    color: splashPalette.title,
    letterSpacing: 0.2,
    textAlign: "center",
  },

  subtitle: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(13),
    fontFamily: fonts.semiBold,
    color: splashPalette.subtitle,
    letterSpacing: 0.6,
    textAlign: "center",
  },
});
