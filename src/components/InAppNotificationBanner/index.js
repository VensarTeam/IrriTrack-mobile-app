import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "react-native-paper";
import styles from "./styles";
import colors from "../../constants/colors";

const NOTIFICATION_DURATION = 4000;

const InAppNotificationBanner = ({ visible, title, message, type = "info", onDismiss }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: insets.top + 10,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        dismissNotification();
      }, NOTIFICATION_DURATION);
    } else {
      dismissNotification();
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible]);

  const dismissNotification = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy < -20) {
          // Swipe up to dismiss
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          dismissNotification();
        } else if (gestureState.dx === 0 && gestureState.dy === 0) {
          // Tap to dismiss
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          dismissNotification();
        }
      },
    })
  ).current;

  const getIconName = () => {
    switch (type) {
      case "success":
        return "check-circle";
      case "warning":
        return "alert-circle";
      case "error":
        return "alert-octagon";
      case "info":
      default:
        return "bell";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "#4CAF50";
      case "warning":
        return "#FF9800";
      case "error":
        return "#F44336";
      case "info":
      default:
        return colors.primaryBlue;
    }
  };

  return (
    <Animated.View
      pointerEvents={visible ? "auto" : "none"}
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.bannerContent}>
        <View style={styles.iconContainer}>
          <Icon source={getIconName()} size={24} color={getIconColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default InAppNotificationBanner;
