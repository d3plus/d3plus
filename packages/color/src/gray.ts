/**
 * The gray scale d3plus uses for neutral ink (axes, gridlines, missing data),
 * keyed by lightness step from 50 (lightest) to 900 (darkest). Values are the
 * [open-color](https://yeun.github.io/open-color/) gray steps (MIT).
 */
const colorGray = {
  50: "#f8f9fa",
  100: "#f1f3f5",
  200: "#e9ecef",
  300: "#dee2e6",
  400: "#ced4da",
  500: "#adb5bd",
  600: "#868e96",
  700: "#495057",
  800: "#343a40",
  900: "#212529",
} as const;

export default colorGray;
