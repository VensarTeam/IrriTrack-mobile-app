import React from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import ImageViewer from "react-native-image-zoom-viewer";
import { IconButton } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const PAGE_FLIP_THRESHOLD = 180;
const EDGE_OVERFLOW = 24;
const MAX_ZOOM_SCALE = 100;

const normalizeItems = (items = []) =>
  items
    .filter((item) => item?.uri || item?.source)
    .map((item, index) => ({
      id: item.id || `${item.uri || "local-source"}-${index}`,
      viewerSource: item.source
        ? { props: { source: item.source } }
        : item.uri
          ? { url: item.uri }
          : null,
      title: item.title || "",
      meta: item.meta || "",
    }))
    .filter((item) => item.viewerSource);

const ImageViewerModal = ({
  visible = false,
  items = [],
  initialIndex = 0,
  onRequestClose,
  onIndexChange,
  backgroundColor = colors.white,
}) => {
  const viewerItems = React.useMemo(() => normalizeItems(items), [items]);
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    const nextIndex = Math.min(
      Math.max(0, initialIndex),
      Math.max(0, viewerItems.length - 1)
    );
    setActiveIndex(nextIndex);
  }, [initialIndex, viewerItems.length, visible]);

  const handleIndexChange = React.useCallback(
    (nextIndex) => {
      const boundedIndex = Math.min(
        Math.max(0, Number(nextIndex) || 0),
        Math.max(0, viewerItems.length - 1)
      );
      setActiveIndex(boundedIndex);
      onIndexChange?.(boundedIndex);
    },
    [onIndexChange, viewerItems.length]
  );

  const HeaderComponent = React.useMemo(
    () =>
      ({ imageIndex }) => {
        const activeItem = viewerItems[imageIndex] || null;

        return (
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.title} numberOfLines={1}>
                  {activeItem?.title || "Image Preview"}
                </Text>
                {/* {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null} */}
              </View>
              <IconButton
                icon="close"
                iconColor={colors.textDark}
                onPress={onRequestClose}
              />
            </View>
          </SafeAreaView>
        );
      },
    [onRequestClose, viewerItems]
  );

  const FooterComponent = React.useMemo(
    () =>
      () => {
        return (
          <SafeAreaView edges={["bottom"]} style={styles.footerSafeArea}>
            <View style={styles.footer}>
              {/* <Text style={styles.meta} numberOfLines={2}>
                {viewerItems.length > 1
                  ? "Swipe left or right to browse more images."
                  : "Pinch or double tap to zoom."}
              </Text> */}
            </View>
          </SafeAreaView>
        );
      },
    [viewerItems]
  );

  if (!viewerItems.length) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      presentationStyle="fullScreen"
      onRequestClose={onRequestClose}
    >
      <ImageViewer
        key={`${visible ? "visible" : "hidden"}-${activeIndex}-${viewerItems.length}`}
        imageUrls={viewerItems.map((item) => item.viewerSource)}
        index={activeIndex}
        onCancel={onRequestClose}
        onChange={handleIndexChange}
        renderHeader={(imageIndex) => <HeaderComponent imageIndex={imageIndex || 0} />}
        renderFooter={() => <FooterComponent />}
        renderIndicator={() => null}
        enableSwipeDown={false}
        saveToLocalByLongPress={false}
        enablePreload
        backgroundColor={backgroundColor}
        useNativeDriver={false}
        flipThreshold={PAGE_FLIP_THRESHOLD}
        maxOverflow={EDGE_OVERFLOW}
        maxScale={MAX_ZOOM_SCALE}
        minScale={1}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  headerSafeArea: {
    backgroundColor: "transparent",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingTop: verticalScale(2),
    paddingBottom: verticalScale(4),
  },
  headerCopy: {
    flex: 1,
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(12),
  },
  title: {
    color: colors.textDark,
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
  },
  subtitle: {
    marginTop: verticalScale(2),
    color: colors.textSecondary,
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
  },
  footerSafeArea: {
    backgroundColor: "transparent",
  },
  footer: {
    paddingBottom: verticalScale(16),
    paddingTop: verticalScale(6),
  },
  meta: {
    marginTop: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    color: "rgba(255,255,255,0.72)",
    fontSize: moderateScale(12),
    textAlign: "center",
    fontFamily: fonts.medium,
  },
});

export default ImageViewerModal;
