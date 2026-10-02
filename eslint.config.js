import tseslint from "typescript-eslint";
import globals from "globals";
import react from "eslint-plugin-react";
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
export default [
  js.configs.recommended,
  {
    ignores: ["packages/docs/build/**", "packages/docs/.next/**"],
  },
  {
    files: ["**/*.js"],
    plugins: {
      js,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
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
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
    },
    rules: {
      ...tseslint.configs.recommended
        .filter(c => c.rules)
        .reduce((acc, c) => ({...acc, ...c.rules}), {}),
      // Relaxed for recently-migrated TypeScript codebase
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": ["error", {argsIgnorePattern: "^_"}],
      "prefer-const": "warn",
      "max-lines": ["error", {max: 500, skipBlankLines: true, skipComments: true}],
      "max-lines-per-function": [
        "error",
        {max: 100, skipBlankLines: true, skipComments: true},
      ],
    },
  },
  {
    // Translation/data dictionaries are data, not code — exempt from file size.
    files: ["packages/locales/**/*.ts"],
    rules: {
      "max-lines": "off",
    },
  },
  {
    // Storybook stories, args, helpers, and config. The generated story header
    // always imports React and funcify, whether or not the stories below the
    // marker use them.
    files: ["packages/docs/**/*.jsx"],
    plugins: {react},
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
    },
    settings: {react: {version: "detect"}},
    rules: {
      "react/jsx-uses-react": "error",
      "react/jsx-uses-vars": "error",
      "no-unused-vars": [
        "error",
        {varsIgnorePattern: "^(React|funcify)$", argsIgnorePattern: "^_"},
      ],
    },
  },
  {
    // A story file with no exported stories is a generated stub that does not
    // appear in the built site. Its header already imports the function (or
    // defines the Template) the stories will use, so `story-exports` and
    // `no-unused-vars` stay warnings until every stub is filled in (#761).
    files: ["packages/docs/packages/**/*.stories.jsx"],
    plugins: {storybook},
    rules: {
      "no-unused-vars": [
        "warn",
        {varsIgnorePattern: "^(React|funcify)$", argsIgnorePattern: "^_"},
      ],
      "storybook/default-exports": "error",
      "storybook/hierarchy-separator": "error",
      "storybook/no-redundant-story-name": "error",
      "storybook/no-renderer-packages": "error",
      "storybook/prefer-pascal-case": "error",
      "storybook/story-exports": "warn",
    },
  },
  {
    files: ["**/test/**/*.js", "**/test/**/*.mjs"],
    languageOptions: {
      globals: {
        it: "readonly",
        before: "readonly",
        after: "readonly",
        global: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        process: "readonly",
        MouseEvent: "readonly",
      },
    },
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
];
