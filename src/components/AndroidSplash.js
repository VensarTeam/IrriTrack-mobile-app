import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const AndroidSplash = ({ onLayout }) => {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(8)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-160)).current;

  useEffect(() => {
    const introAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 440,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          delay: 120,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(progress, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]);

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 160,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    introAnimation.start();
    glowLoop.start();
    shimmerLoop.start();

    return () => {
      introAnimation.stop();
      glowLoop.stop();
      shimmerLoop.stop();
    };
  }, [
    glowPulse,
    logoOpacity,
    logoScale,
    progress,
    shimmerX,
    subtitleOpacity,
    titleOpacity,
    titleTranslateY,
  ]);

  const glowScale = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.14],
  });

  const glowOpacity = glowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.48],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["8%", "100%"],
  });

  return (
    <View style={styles.container} onLayout={onLayout}>
      <LinearGradient
        colors={["#F8FCFF", "#EDF6FF", "#E5F2FF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.orb,
            styles.orbTop,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.orb,
            styles.orbBottom,
            {
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        <View style={styles.centerShell}>
          <Animated.View
            style={[
              styles.logoHalo,
              {
                opacity: glowOpacity,
                transform: [{ scale: glowScale }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.logoWrap,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <Image
              source={require("../assets/images/logo.png")}
              resizeMode="contain"
              style={styles.logo}
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.title,
              {
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Project Management Tools
          </Animated.Text>

          <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
            PMT
          </Animated.Text>

          <View style={styles.loaderTrack}>
            <Animated.View style={[styles.loaderFill, { width: progressWidth }]} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.loaderShimmer,
                {
                  transform: [{ translateX: shimmerX }],
                },
              ]}
            />
          </View>

          <Text style={styles.footnote}>Loading secure workspace...</Text>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(24),
  },

  orb: {
    position: "absolute",
    borderRadius: moderateScale(200),
    backgroundColor: "#A8D4FF",
  },

  orbTop: {
    width: moderateScale(220),
    height: moderateScale(220),
    top: -moderateScale(90),
    right: -moderateScale(70),
  },

  orbBottom: {
    width: moderateScale(260),
    height: moderateScale(260),
    bottom: -moderateScale(125),
    left: -moderateScale(90),
  },

  centerShell: {
    width: "100%",
    alignItems: "center",
  },

  logoHalo: {
    position: "absolute",
    top: verticalScale(-14),
    width: moderateScale(148),
    height: moderateScale(148),
    borderRadius: moderateScale(74),
    backgroundColor: "#D6EBFF",
  },

  logoWrap: {
    width: moderateScale(132),
    height: moderateScale(132),
    borderRadius: moderateScale(24),
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#D7E8FA",
    shadowColor: "#1A4B75",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 6,
  },

  logo: {
    width: "78%",
    height: "78%",
  },

  title: {
    marginTop: verticalScale(26),
    fontSize: moderateScale(22),
    fontFamily: fonts.bold,
    color: colors.textDark,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  subtitle: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(15),
    fontFamily: fonts.medium,
    color: colors.primaryBlue,
    textAlign: "center",
  },

  loaderTrack: {
    marginTop: verticalScale(26),
    width: "76%",
    height: verticalScale(7),
    borderRadius: moderateScale(10),
    overflow: "hidden",
    backgroundColor: "#DCEAF8",
  },

  loaderFill: {
    height: "100%",
    borderRadius: moderateScale(10),
    backgroundColor: colors.primaryBlue,
  },

  loaderShimmer: {
    position: "absolute",
    width: moderateScale(46),
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  footnote: {
    marginTop: verticalScale(12),
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
    letterSpacing: 0.2,
  },
});
