import { Dimensions, PixelRatio, Platform } from "react-native";

const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const MAX_IOS_WIDTH_SCALE = 1.08;
const MAX_IOS_HEIGHT_SCALE = 1.08;

const getScaleFactors = () => {
  const { width, height } = Dimensions.get("window");
  const widthScale = width / guidelineBaseWidth;
  const heightScale = height / guidelineBaseHeight;

  if (Platform.OS !== "ios") {
    return { widthScale, heightScale };
  }

  return {
    widthScale: Math.min(widthScale, MAX_IOS_WIDTH_SCALE),
    heightScale: Math.min(heightScale, MAX_IOS_HEIGHT_SCALE),
  };
};

const round = (value) => PixelRatio.roundToNearestPixel(value);

export const scale = (size) => {
  const { widthScale } = getScaleFactors();
  return round(size * widthScale);
};

export const verticalScale = (size) => {
  const { heightScale } = getScaleFactors();
  return round(size * heightScale);
};

export const moderateScale = (size, factor = 0.5) => {
  const scaled = scale(size);
  return round(size + (scaled - size) * factor);
};

export const fontScale = (size) => {
  if (Platform.OS === "ios") {
    // Text/TextInput apply Dynamic Type themselves. Multiplying by the system
    // font scale here applies it twice and can make small labels unreadable.
    return round(size + (size < 12 ? 2.5 : 1.5));
  }
  return round(size * PixelRatio.getFontScale());
};
