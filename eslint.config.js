// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
// export default [js.configs.recommended];
export default {
  plugins: {
    js
  },
  languageOptions: {
    globals: {
      browser: true,
      node: true
    }
  }
};