import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Icon, Searchbar } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const SearchableFilterModal = ({
  visible,
  title,
  subtitle,
  options = [],
  selectedValue = "",
  onSelect,
  onClose,
  searchPlaceholder = "Search",
  emptyMessage = "No options found.",
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = React.useState(false);
  const [isSearchFocused, setIsSearchFocused] = React.useState(false);
  const lastSearchBlurAtRef = React.useRef(0);

  React.useEffect(() => {
    if (!visible) {
      setSearchQuery("");
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

  const filteredOptions = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    const allOption = options.find((option) => option === "All");
    const matchedOptions = options.filter(
      (option) =>
        option !== "All" && option.toLowerCase().includes(normalizedQuery)
    );

    return allOption ? ["All", ...matchedOptions] : matchedOptions;
  }, [options, searchQuery]);

  const bottomInset = Math.max(insets.bottom, 0);
  const shouldKeepSheetExpanded =
    searchQuery.trim().length > 0 && filteredOptions.length <= 1;
  const androidSheetOffset =
    Platform.OS === "android" && keyboardHeight > 0
      ? Math.max(keyboardHeight - insets.bottom - verticalScale(10), 0)
      : 0;

  const handleRequestClose = React.useCallback(() => {
    const didRecentlyBlurSearchInput =
      Date.now() - lastSearchBlurAtRef.current < 250;

    if (isSearchFocused || isKeyboardVisible || didRecentlyBlurSearchInput) {
      Keyboard.dismiss();
      return;
    }

    onClose?.();
  }, [isKeyboardVisible, isSearchFocused, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoider}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={bottomInset}
        >
          <View
            style={[
              styles.card,
              shouldKeepSheetExpanded && styles.cardExpanded,
              {
                marginBottom: androidSheetOffset,
                paddingBottom: verticalScale(16) + bottomInset,
              },
            ]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <Searchbar
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
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

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              contentContainerStyle={[
                styles.listContent,
                shouldKeepSheetExpanded && styles.listContentExpanded,
              ]}
            >
              {filteredOptions.length ? (
                filteredOptions.map((item) => {
                  const isActive = item === selectedValue;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.optionItem,
                        isActive && styles.optionItemActive,
                      ]}
                      onPress={() => onSelect(item)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isActive && styles.optionTextActive,
                        ]}
                      >
                        {item}
                      </Text>

                      <View
                        style={[
                          styles.checkWrap,
                          isActive && styles.checkWrapActive,
                        ]}
                      >
                        {isActive ? (
                          <Icon source="check" size={14} color={colors.white} />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{emptyMessage}</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
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

  keyboardAvoider: {
    flex: 1,
    justifyContent: "flex-end",
  },

  card: {
    maxHeight: "78%",
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: moderateScale(18),
    paddingTop: verticalScale(12),
  },

  cardExpanded: {
    minHeight: verticalScale(310),
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
    paddingBottom: verticalScale(4),
  },

  listContentExpanded: {
    flexGrow: 1,
  },

  optionItem: {
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

  optionItemActive: {
    borderColor: colors.primaryBlue,
    backgroundColor: "#EEF6FF",
  },

  optionText: {
    flex: 1,
    marginRight: moderateScale(10),
    fontSize: moderateScale(13),
    color: colors.textDark,
    fontFamily: fonts.medium,
  },

  optionTextActive: {
    color: colors.primaryBlue,
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
    backgroundColor: colors.primaryBlue,
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

  closeButton: {
    marginTop: verticalScale(6),
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
