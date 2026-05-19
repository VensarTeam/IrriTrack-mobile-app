import React from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import {
  fontScale,
  moderateScale,
  scale,
  verticalScale,
} from "../constants/metrics";

// ─────────────────────────────────────────────
// TAB CONFIG — mirrors TAB_THEME in WorkStatusScreen
// ─────────────────────────────────────────────
const TAB_META = {
  Submitted: {
    solid: "#123B63",
    soft: "#FFF1E7",
    icon: "⏳",
    activeGradient: ["#F47B20", "#E05E0A"],
  },
  Pending: {
    solid: "#123B63",
    soft: "#FFF5EA",
    icon: "🔄",
    activeGradient: ["#F0900A", "#C96E0A"],
  },
  Verified: {
    solid: "#123B63",
    soft: "#ECF4FF",
    icon: "🛡",
    activeGradient: ["#2468B0", "#123B63"],
  },
  Approved: {
    solid: "#123B63",
    soft: "#EDFCF4",
    icon: "✅",
    activeGradient: ["#18B06A", "#0D7A47"],
  },
  Commented: {
    solid: "#123B63",
    soft: "#FFF1EC",
    icon: "💬",
    activeGradient: ["#E06848", "#A8472E"],
  },
  Info: {
    solid: "#123B63",
    soft: "#EAF4FF",
    icon: "ℹ️",
    activeGradient: ["#2A82D9", "#1A4F7A"],
  },
};

const TAB_LABELS = {
  Submitted: "All",
  Pending: "Latest Submitted",
};

const getTabLabel = (tab) => TAB_LABELS[tab] || tab;

// ─────────────────────────────────────────────
// SINGLE TAB PILL
// ─────────────────────────────────────────────
const TabPill = React.memo(({ tab, isActive, count, onPress }) => {
  const meta = TAB_META[tab] || TAB_META.Pending;
  const label = getTabLabel(tab);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(isActive ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive, opacityAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          tabPillStyles.pill,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Active filled background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            tabPillStyles.activeFill,
            {
              backgroundColor: meta.solid,
              opacity: opacityAnim,
              borderRadius: moderateScale(14),
            },
          ]}
        />

        {/* Inactive ghost border */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            tabPillStyles.inactiveBorder,
            {
              borderColor: "#DCE7F2",
              opacity: opacityAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0],
              }),
              borderRadius: moderateScale(14),
            },
          ]}
        />

        <View style={tabPillStyles.inner}>
          {/* Label */}
          <Animated.Text
            numberOfLines={1}
            style={[
              tabPillStyles.label,
              {
                color: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [colors.textSecondary, "#FFFFFF"],
                }),
                fontFamily: isActive ? fonts.bold : fonts.semiBold,
              },
            ]}
          >
            {label}
          </Animated.Text>

          {/* Count badge */}
          <Animated.View
            style={[
              tabPillStyles.badge,
              {
                backgroundColor: opacityAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["#E8EFF7", "rgba(255,255,255,0.22)"],
                }),
              },
            ]}
          >
            <Animated.Text
              style={[
                tabPillStyles.badgeText,
                {
                  color: opacityAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [meta.solid, "#FFFFFF"],
                  }),
                },
              ]}
            >
              {String(count)}
            </Animated.Text>
          </Animated.View>
        </View>

        {/* Active bottom dot indicator */}
        {isActive && (
          <View
            style={[
              tabPillStyles.activeDot,
              { backgroundColor: "rgba(255,255,255,0.55)" },
            ]}
          />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
});

const tabPillStyles = StyleSheet.create({
  pill: {
    height: verticalScale(42),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(14),
    marginRight: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
    minWidth: moderateScale(112),
    position: "relative",
    overflow: "hidden",
  },
  activeFill: {
    borderRadius: moderateScale(14),
  },
  inactiveBorder: {
    borderWidth: 1,
    borderRadius: moderateScale(14),
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    zIndex: 1,
  },
  label: {
    fontSize: fontScale(12.5),
    letterSpacing: 0.1,
  },
  badge: {
    minWidth: moderateScale(26),
    height: moderateScale(20),
    paddingHorizontal: moderateScale(6),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: fontScale(10.5),
    fontFamily: fonts.bold,
    textAlign: "center",
    lineHeight: fontScale(14),
  },
  activeDot: {
    position: "absolute",
    bottom: moderateScale(5),
    alignSelf: "center",
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
  },
});

// ─────────────────────────────────────────────
// CUSTOM TAB BAR
// ─────────────────────────────────────────────
export const CustomTabBar = React.memo(({ tabs, activeTabIndex, countsByTab, onTabPress }) => {
  const scrollRef = React.useRef(null);
  const tabOffsetsRef = React.useRef({});

  const scrollToTab = React.useCallback((index) => {
    const tab = tabs[index];
    const offset = tabOffsetsRef.current[tab];

    if (scrollRef.current && offset !== undefined) {
      scrollRef.current.scrollTo({ x: Math.max(0, offset - moderateScale(20)), animated: true });
    }
  }, [tabs]);

  React.useEffect(() => {
    scrollToTab(activeTabIndex);
  }, [activeTabIndex, scrollToTab]);

  return (
    <View style={tabBarStyles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabBarStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        decelerationRate="fast"
      >
        {tabs.map((tab, index) => {
          const count = Number(countsByTab?.[tab] ?? 0);
          const isActive = index === activeTabIndex;

          return (
            <View
              key={tab}
              onLayout={(e) => {
                tabOffsetsRef.current[tab] = e.nativeEvent.layout.x;
              }}
            >
              <TabPill
                tab={tab}
                isActive={isActive}
                count={count}
                onPress={() => onTabPress(index)}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom separator */}
      <View style={tabBarStyles.separator} />
    </View>
  );
});

const tabBarStyles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    paddingTop: verticalScale(10),
    ...Platform.select({
      ios: {
        shadowColor: "#B4C8D8",
        shadowOffset: { width: 0, height: verticalScale(4) },
        shadowOpacity: 0.10,
        shadowRadius: scale(8),
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    paddingHorizontal: moderateScale(15),
    paddingBottom: verticalScale(10),
    gap: 0,
  },
  separator: {
    height: 1,
    backgroundColor: "#EAF0F7",
  },
});

// ─────────────────────────────────────────────
// CUSTOM TAB VIEW
// Replaces <TabView> + renderTabBar entirely.
// Uses a horizontal FlatList for swipe-free, lazy scene rendering.
// ─────────────────────────────────────────────
export const CustomTabView = ({
  tabs,
  activeTabIndex,
  onIndexChange,
  countsByTab,
  renderScene,
}) => {
  const flatListRef = React.useRef(null);
  const screenWidth = Dimensions.get("window").width;

  // Scroll to active tab when index changes externally
  React.useEffect(() => {
    flatListRef.current?.scrollToIndex({
      index: activeTabIndex,
      animated: false, // instant — tab bar handles visual feedback
    });
  }, [activeTabIndex]);

  const handleTabPress = React.useCallback(
    (index) => {
      onIndexChange(index);
    },
    [onIndexChange]
  );

  const getItemLayout = React.useCallback(
    (_, index) => ({
      length: screenWidth,
      offset: screenWidth * index,
      index,
    }),
    [screenWidth]
  );

  const renderItem = React.useCallback(
    ({ item: tab, index }) => (
      <View style={{ width: screenWidth, flex: 1 }}>
        {renderScene({ route: { key: tab, title: tab }, index })}
      </View>
    ),
    [screenWidth, renderScene]
  );

  return (
    <View style={tabViewStyles.root}>
      <CustomTabBar
        tabs={tabs}
        activeTabIndex={activeTabIndex}
        countsByTab={countsByTab}
        onTabPress={handleTabPress}
        isScrollable
      />

      <FlatList
        ref={flatListRef}
        data={tabs}
        keyExtractor={(tab) => tab}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={false}          // tab bar drives navigation, no swipe
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={activeTabIndex}
        windowSize={3}                 // render active + 1 neighbour each side
        maxToRenderPerBatch={2}
        removeClippedSubviews={Platform.OS === "android"}
        style={tabViewStyles.scenes}
      />
    </View>
  );
};

const tabViewStyles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scenes: {
    flex: 1,
  },
});
