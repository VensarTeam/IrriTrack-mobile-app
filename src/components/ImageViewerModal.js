import React from "react";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconButton } from "react-native-paper";
import colors from "../constants/colors";
import fonts from "../constants/fonts";
import { moderateScale, verticalScale } from "../constants/metrics";

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.5;

const clampScale = (value) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value) || MIN_SCALE));

const getTouchDistance = (touches = []) => {
  if (!Array.isArray(touches) || touches.length < 2) {
    return 0;
  }

  const [firstTouch, secondTouch] = touches;
  const deltaX = Number(secondTouch.pageX || 0) - Number(firstTouch.pageX || 0);
  const deltaY = Number(secondTouch.pageY || 0) - Number(firstTouch.pageY || 0);

  return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
};

const normalizeItems = (items = []) =>
  items
    .filter((item) => item?.uri || item?.source)
    .map((item, index) => ({
      id: item.id || `${item.uri || "local-source"}-${index}`,
      uri: item.uri || "",
      source: item.source || null,
      title: item.title || "",
      meta: item.meta || "",
    }));

const ImageViewerModal = ({
  visible = false,
  items = [],
  initialIndex = 0,
  onRequestClose,
  onIndexChange,
}) => {
  const viewerItems = React.useMemo(() => normalizeItems(items), [items]);
  const [activeIndex, setActiveIndex] = React.useState(initialIndex);
  const scaleAnim = React.useRef(new Animated.Value(MIN_SCALE)).current;
  const translateXAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;
  const scaleRef = React.useRef(MIN_SCALE);
  const translateXRef = React.useRef(0);
  const translateYRef = React.useRef(0);
  const pinchStartDistanceRef = React.useRef(0);
  const pinchStartScaleRef = React.useRef(MIN_SCALE);
  const panStartRef = React.useRef({ x: 0, y: 0 });

  const resetPan = React.useCallback(() => {
    translateXRef.current = 0;
    translateYRef.current = 0;
    translateXAnim.setValue(0);
    translateYAnim.setValue(0);
  }, [translateXAnim, translateYAnim]);

  React.useEffect(() => {
    if (!visible) {
      scaleRef.current = MIN_SCALE;
      scaleAnim.setValue(MIN_SCALE);
      resetPan();
      pinchStartDistanceRef.current = 0;
      pinchStartScaleRef.current = MIN_SCALE;
      return;
    }

    const nextIndex = Math.min(
      Math.max(0, initialIndex),
      Math.max(0, viewerItems.length - 1)
    );
    setActiveIndex(nextIndex);
    scaleRef.current = MIN_SCALE;
    scaleAnim.setValue(MIN_SCALE);
    resetPan();
    pinchStartDistanceRef.current = 0;
    pinchStartScaleRef.current = MIN_SCALE;
  }, [initialIndex, resetPan, scaleAnim, viewerItems.length, visible]);

  const activeItem = viewerItems[activeIndex] || null;
  const activeImageSource = activeItem?.source || (activeItem?.uri ? { uri: activeItem.uri } : null);
  const canGoPrevious = activeIndex > 0;
  const canGoNext = activeIndex < viewerItems.length - 1;

  const updateIndex = (nextIndex) => {
    const boundedIndex = Math.min(
      Math.max(0, nextIndex),
      Math.max(0, viewerItems.length - 1)
    );
    setActiveIndex(boundedIndex);
    scaleRef.current = MIN_SCALE;
    scaleAnim.setValue(MIN_SCALE);
    resetPan();
    pinchStartDistanceRef.current = 0;
    pinchStartScaleRef.current = MIN_SCALE;
    onIndexChange?.(boundedIndex);
  };

  const handleTouchStart = React.useCallback((event) => {
    const touches = event?.nativeEvent?.touches || [];

    if (touches.length >= 2) {
      pinchStartDistanceRef.current = getTouchDistance(touches);
      pinchStartScaleRef.current = scaleRef.current;
    }
  }, []);

  const handleTouchMove = React.useCallback(
    (event) => {
      const touches = event?.nativeEvent?.touches || [];

      if (touches.length < 2) {
        return;
      }

      const currentDistance = getTouchDistance(touches);

      if (!currentDistance) {
        return;
      }

      if (!pinchStartDistanceRef.current) {
        pinchStartDistanceRef.current = currentDistance;
        pinchStartScaleRef.current = scaleRef.current;
        return;
      }

      const nextScale = clampScale(
        pinchStartScaleRef.current *
          (currentDistance / pinchStartDistanceRef.current)
      );

      scaleRef.current = nextScale;
      scaleAnim.setValue(nextScale);
    },
    [scaleAnim]
  );

  const handleTouchEnd = React.useCallback(
    (event) => {
      const touches = event?.nativeEvent?.touches || [];

      if (touches.length >= 2) {
        pinchStartDistanceRef.current = getTouchDistance(touches);
        pinchStartScaleRef.current = scaleRef.current;
        return;
      }

      pinchStartDistanceRef.current = 0;
      pinchStartScaleRef.current = scaleRef.current;
    },
    []
  );

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          scaleRef.current > MIN_SCALE &&
          (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
        onPanResponderGrant: () => {
          panStartRef.current = {
            x: translateXRef.current,
            y: translateYRef.current,
          };
        },
        onPanResponderMove: (_, gestureState) => {
          if (scaleRef.current <= MIN_SCALE) {
            return;
          }

          const nextX = panStartRef.current.x + gestureState.dx;
          const nextY = panStartRef.current.y + gestureState.dy;
          translateXRef.current = nextX;
          translateYRef.current = nextY;
          translateXAnim.setValue(nextX);
          translateYAnim.setValue(nextY);
        },
        onPanResponderTerminationRequest: () => true,
        onPanResponderRelease: () => {
          panStartRef.current = {
            x: translateXRef.current,
            y: translateYRef.current,
          };
        },
        onPanResponderTerminate: () => {
          panStartRef.current = {
            x: translateXRef.current,
            y: translateYRef.current,
          };
        },
      }),
    [translateXAnim, translateYAnim]
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onRequestClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title} numberOfLines={1}>
              {activeItem?.title || "Image Preview"}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {viewerItems.length > 1
                ? `${activeIndex + 1} / ${viewerItems.length}`
                : activeItem?.meta || "Zoom available"}
            </Text>
          </View>
          <IconButton icon="close" iconColor={colors.white} onPress={onRequestClose} />
        </View>

        <View style={styles.viewerStage}>
          <View style={styles.imageFrame}>
            {activeImageSource ? (
              <View
                style={styles.imageTouchLayer}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                {...panResponder.panHandlers}
              >
                <Animated.Image
                  source={activeImageSource}
                  style={[
                    styles.image,
                    {
                      transform: [
                        { translateX: translateXAnim },
                        { translateY: translateYAnim },
                        { scale: scaleAnim },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>

        </View>

        {viewerItems.length > 1 ? (
          <>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonLeft,
                !canGoPrevious && styles.navButtonDisabled,
              ]}
              onPress={() => updateIndex(activeIndex - 1)}
              disabled={!canGoPrevious}
              activeOpacity={0.88}
            >
              <Text style={styles.navButtonText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonRight,
                !canGoNext && styles.navButtonDisabled,
              ]}
              onPress={() => updateIndex(activeIndex + 1)}
              disabled={!canGoNext}
              activeOpacity={0.88}
            >
              <Text style={styles.navButtonText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.footer}>
          {activeItem?.meta ? (
            <Text style={styles.meta} numberOfLines={2}>
              {activeItem.meta}
            </Text>
          ) : (
            <Text style={styles.meta}>
              Pinch with two fingers to zoom and drag to inspect corners.
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#05070B",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
  },
  headerCopy: {
    flex: 1,
    paddingLeft: moderateScale(10),
    paddingRight: moderateScale(12),
  },
  title: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontFamily: fonts.bold,
  },
  subtitle: {
    marginTop: verticalScale(2),
    color: "rgba(255,255,255,0.74)",
    fontSize: moderateScale(11),
    fontFamily: fonts.medium,
  },
  viewerStage: {
    flex: 1,
    position: "relative",
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -moderateScale(26),
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(18),
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  navButtonLeft: {
    left: moderateScale(8),
  },
  navButtonRight: {
    right: moderateScale(8),
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  navButtonText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontFamily: fonts.bold,
  },
  imageFrame: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imageTouchLayer: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingHorizontal: 0,
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
