import React from "react";
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Icon, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const SHIMMER_ITEM_COUNT = 6;
const FOOTER_SHIMMER_ITEM_COUNT = 2;
const SHIMMER_DURATION = 1100;
const SHIMMER_TRAVEL_DISTANCE = moderateScale(240);

const SearchableFilterModal = ({
  visible,
  title,
  subtitle,
  options = [],
  isLoading = false,
  isFetchingMore = false,
  hasMoreOptions = false,
  selectedValue = "",
  onSelect,
  onClose,
  onEndReached,
  searchQuery = "",
  onSearchQueryChange,
  searchPlaceholder = "Search",
  emptyMessage = "No options found.",
}) => {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [localSearchQuery, setLocalSearchQuery] = React.useState("");
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const lastSearchBlurAtRef = React.useRef(0);
  const shimmerProgress = React.useRef(new Animated.Value(0)).current;
  const usesControlledSearch = typeof onSearchQueryChange === "function";
  const activeSearchQuery = usesControlledSearch
    ? String(searchQuery || "")
    : localSearchQuery;

  React.useEffect(() => {
    if (!visible || !isLoading) {
      shimmerProgress.stopAnimation();
      shimmerProgress.setValue(0);
      return undefined;
    }

    const animation = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: SHIMMER_DURATION,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
      shimmerProgress.setValue(0);
    };
  }, [isLoading, shimmerProgress, visible]);

  React.useEffect(() => {
    if (!visible) {
      setLocalSearchQuery("");
      onSearchQueryChange?.("");
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
      setIsSearchFocused(false);
      lastSearchBlurAtRef.current = 0;
      return undefined;
    }

    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const keyboardShowSubscription = Keyboard.addListener(showEvent, (event) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates?.height || 0);
    });

    const keyboardHideSubscription = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, [visible]);

  React.useEffect(() => {
    if (!usesControlledSearch) {
      return;
    }

    setLocalSearchQuery(String(searchQuery || ""));
  }, [searchQuery, usesControlledSearch]);

  const handleSearchChange = React.useCallback(
    (value) => {
      setLocalSearchQuery(value);
      onSearchQueryChange?.(value);
    },
    [onSearchQueryChange]
  );

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = activeSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    const allOption = options.find((option) => option === "All");
    const matchedOptions = options.filter(
      (option) =>
        option !== "All" && option.toLowerCase().includes(normalizedQuery)
    );

    return allOption ? ["All", ...matchedOptions] : matchedOptions;
  }, [activeSearchQuery, options]);

  const bottomInset = Math.max(insets.bottom, 0);
  const topInset = Math.max(insets.top, verticalScale(12));
  const androidSheetOffset =
    Platform.OS === "android" && keyboardHeight > 0
      ? Math.max(keyboardHeight - insets.bottom - verticalScale(10), 0)
      : 0;
  const maxCardHeight = Math.max(
    windowHeight - topInset - androidSheetOffset - verticalScale(10),
    verticalScale(260)
  );
  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SHIMMER_TRAVEL_DISTANCE, SHIMMER_TRAVEL_DISTANCE],
  });

  const handleRequestClose = React.useCallback(() => {
    const didRecentlyBlurSearchInput =
      Date.now() - lastSearchBlurAtRef.current < 250;

    if (isSearchFocused || isKeyboardVisible || didRecentlyBlurSearchInput) {
      Keyboard.dismiss();
      return;
    }

    onClose?.();
  }, [isKeyboardVisible, isSearchFocused, onClose]);

  const renderOption = React.useCallback(
    ({ item }) => {
      const optionLabel = String(item || "");
      const isActive = optionLabel === selectedValue;

      return (
        <TouchableOpacity
          style={[styles.optionItem, isActive && styles.optionItemActive]}
          onPress={() => onSelect(optionLabel)}
          activeOpacity={0.85}
        >
          <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
            {optionLabel}
          </Text>

          <View style={[styles.checkWrap, isActive && styles.checkWrapActive]}>
            {isActive ? (
              <Icon source="check" size={14} color={colors.white} />
            ) : null}
          </View>
        </TouchableOpacity>
      );
    },
    [onSelect, selectedValue]
  );

  const renderLoadingItem = React.useCallback(
    ({ item }) => (
      <View key={item} style={styles.shimmerItem}>
        <View style={styles.shimmerItemCopy}>
          <View style={[styles.shimmerBlock, styles.shimmerLinePrimary]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerSweep,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.85)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>

          <View style={[styles.shimmerBlock, styles.shimmerLineSecondary]}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmerSweep,
                {
                  transform: [{ translateX: shimmerTranslateX }],
                },
              ]}
            >
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0)",
                  "rgba(255,255,255,0.8)",
                  "rgba(255,255,255,0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
        </View>

        <View style={[styles.shimmerBlock, styles.shimmerIndicator]}>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmerSweep,
              {
                transform: [{ translateX: shimmerTranslateX }],
              },
            ]}
          >
            <LinearGradient
              colors={[
                "rgba(255,255,255,0)",
                "rgba(255,255,255,0.82)",
                "rgba(255,255,255,0)",
              ]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        </View>
      </View>
    ),
    [shimmerTranslateX]
  );

  const keyExtractor = React.useCallback((item, index) => `${item}-${index}`, []);

  const loadingData = React.useMemo(
    () =>
      Array.from({ length: SHIMMER_ITEM_COUNT }, (_, index) => `loading-${index}`),
    []
  );
  const footerLoadingData = React.useMemo(
    () =>
      Array.from(
        { length: FOOTER_SHIMMER_ITEM_COUNT },
        (_, index) => `footer-loading-${index}`
      ),
    []
  );
  const isInitialLoading = isLoading && options.length === 0;

  const listContentStyle = React.useMemo(
    () => [
      styles.listContent,
      !isInitialLoading &&
        filteredOptions.length === 0 &&
        styles.listContentEmpty,
    ],
    [filteredOptions.length, isInitialLoading]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={[styles.overlay, { paddingTop: topInset }]}>
        <Pressable style={styles.backdrop} onPress={handleRequestClose} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={bottomInset}
        >
          <View
            style={[
              styles.card,
              {
                maxHeight: maxCardHeight,
                marginBottom: androidSheetOffset,
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <Searchbar
              placeholder={searchPlaceholder}
              value={activeSearchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                setIsSearchFocused(false);
                lastSearchBlurAtRef.current = Date.now();
              }}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              iconColor={colors.primaryBlue}
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.listWrap}>
              <FlatList
                data={isInitialLoading ? loadingData : filteredOptions}
                keyExtractor={keyExtractor}
                renderItem={isInitialLoading ? renderLoadingItem : renderOption}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={
                  Platform.OS === "ios" ? "interactive" : "on-drag"
                }
                contentContainerStyle={listContentStyle}
                ListEmptyComponent={
                  isInitialLoading ? null : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>{emptyMessage}</Text>
                    </View>
                  )
                }
                ListFooterComponent={
                  isFetchingMore ? (
                    <View style={styles.footerShimmerWrap}>
                      {footerLoadingData.map((item) =>
                        renderLoadingItem({ item })
                      )}
                    </View>
                  ) : (
                    <View style={styles.listFooterSpace} />
                  )
                }
                onEndReached={() => {
                  if (!isInitialLoading && !isFetchingMore && hasMoreOptions) {
                    onEndReached?.();
                  }
                }}
                onEndReachedThreshold={0.25}
              />
            </View>

            <View
              style={[
                styles.footer,
                { paddingBottom: verticalScale(16) + bottomInset },
              ]}
            >
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11, 21, 32, 0.32)",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  keyboardAvoider: {
    flex: 1,
    justifyContent: "flex-end",
  },

  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(12),
    minHeight: verticalScale(480),
    paddingTop: verticalScale(12),
  },

  handle: {
    alignSelf: "center",
    width: moderateScale(48),
    height: verticalScale(4),
    borderRadius: moderateScale(999),
    backgroundColor: colors.cardBorder,
    marginBottom: verticalScale(12),
  },

  title: {
    fontSize: moderateScale(18),
    fontFamily: fonts.bold,
    color: colors.textDark,
  },

  subtitle: {
    marginTop: verticalScale(4),
    fontSize: moderateScale(12),
    lineHeight: moderateScale(18),
    color: colors.textSecondary,
  },

  searchbar: {
    marginTop: verticalScale(14),
    marginBottom: verticalScale(12),
    backgroundColor: "#F7FAFE",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  searchInput: {
    minHeight: verticalScale(18),
    fontSize: moderateScale(13),
    color: colors.textDark,
  },

  listContent: {
    paddingBottom: verticalScale(2),
    flexGrow: 1,
  },

  listContentEmpty: {
    justifyContent: "center",
  },

  listWrap: {
    flex: 1,
    minHeight: verticalScale(220),
  },

  footerShimmerWrap: {
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(6),
  },

  listFooterSpace: {
    height: verticalScale(4),
  },

  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E1EAF4",
    backgroundColor: "#FCFEFF",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(10),
  },

  optionItemActive: {
    borderColor: "#1E5AB6",
    backgroundColor: "#2B66C3",
    shadowColor: "#184A96",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 3,
  },

  optionText: {
    flex: 1,
    marginRight: moderateScale(10),
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  optionTextActive: {
    color: colors.white,
    fontFamily: fonts.bold,
  },

  checkWrap: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
    backgroundColor: "#E8EEF5",
    alignItems: "center",
    justifyContent: "center",
  },

  checkWrapActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
  },

  emptyState: {
    paddingVertical: verticalScale(18),
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: "center",
  },

  loadingText: {
    marginTop: verticalScale(10),
    fontSize: moderateScale(12),
    color: colors.textSecondary,
    textAlign: "center",
  },

  shimmerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E1EAF4",
    backgroundColor: "#FCFEFF",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    marginBottom: verticalScale(10),
  },

  shimmerItemCopy: {
    flex: 1,
    marginRight: moderateScale(14),
  },

  shimmerBlock: {
    overflow: "hidden",
    backgroundColor: "#E9F0F7",
    borderRadius: moderateScale(999),
  },

  shimmerLinePrimary: {
    width: "68%",
    height: verticalScale(14),
    marginBottom: verticalScale(8),
  },

  shimmerLineSecondary: {
    width: "42%",
    height: verticalScale(10),
  },

  shimmerIndicator: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(11),
  },

  shimmerSweep: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -moderateScale(120),
    width: moderateScale(96),
  },

  shimmerGradient: {
    flex: 1,
  },

  footer: {
    paddingTop: verticalScale(8),
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
  },

  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: moderateScale(16),
    backgroundColor: colors.primaryBlue,
    paddingVertical: verticalScale(12),
  },

  closeText: {
    fontSize: moderateScale(13),
    color: colors.white,
    fontFamily: fonts.bold,
  },
});

export default SearchableFilterModal;
