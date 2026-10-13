import React from "react";
import Svg, { Path } from "react-native-svg";
import colors from "../constants/colors";

// SVG paths render without relying on a platform icon-font being registered.
const paths = {
  arrow: ["M4 12h16", "m14 6 6 6-6 6"],
  back: ["M20 12H4", "m10 6-6 6 6 6"],
  chevron: ["m9 5 7 7-7 7"],
  check: ["m5 12 4 4L19 6"],
  close: ["m6 6 12 12", "M18 6 6 18"],
  refresh: ["M20 7v5h-5", "M4 17v-5h5", "M6.1 7a7 7 0 0 1 11.8-1L20 9", "M4 15l2.1 3A7 7 0 0 0 17.9 17"],
  shield: ["M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Z", "m8 12 3 3 5-6"],
  file: ["M14 3H5v18h14V8Z", "M14 3v5h5", "M8 12h8", "M8 16h5"],
  lock: ["M5 11h14v10H5Z", "M8 11V7a4 4 0 0 1 8 0v4", "M12 15v2"],
  support: ["M4 13v-1a8 8 0 0 1 16 0v1", "M4 12H2v6h4v-6Z", "M20 12h2v6h-4v-6Z", "M20 18v3h-6"],
  water: ["M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z", "M8 15a4 4 0 0 0 4 4"],
  monitor: ["M3 3h18v13H3Z", "M8 21h8", "M12 16v5", "m6 12 4-4 4 2 4-5"],
  checklist: ["M8 4H4v17h16V4h-4", "M8 2h8v4H8Z", "m7 12 2 2 3-3", "M15 12h2", "M7 17h10"],
  chart: ["M3 3v18h18", "M7 17v-5h3v5", "M12 17V8h3v9", "M17 17V4h3v13"],
  offline: ["M7 17H5a4 4 0 0 1-1-7.9A6 6 0 0 1 15 6a5 5 0 0 1 5 9", "m10 18 3 3 5-6"],
  "account-remove": ["M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z", "M3 21v-2a7 7 0 0 1 11-5.7", "M16 17h6"],
};

const ConsentIcon = ({ name, size = 22, color = colors.primaryBlue }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
    {(paths[name] || paths.file).map((d, index) => (
      <Path key={index} d={d} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    ))}
  </Svg>
);

export default ConsentIcon;
