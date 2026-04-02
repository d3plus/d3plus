// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";

import js from "@eslint/js";
// export default [js.configs.recommended];
export default [
  {
    files: ["**/*.js"],
    plugins: {
      js,
    },
    languageOptions: {
      globals: {
        browser: true,
        node: true,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      globals: {
        browser: true,
        node: true,
      },
      parser: tseslint.parser,
    },
  },
];
