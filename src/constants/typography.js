import { moderateScale } from "./metrics";
import fonts from "./fonts";

const typography = {
  h1: moderateScale(24),
  h2: moderateScale(20),
  body: moderateScale(16),
  small: moderateScale(14),

  regular: {
    fontFamily: fonts.regular,
  },

  medium: {
    fontFamily: fonts.medium,
  },

  bold: {
    fontFamily: fonts.bold,
  },
};

export default typography;
