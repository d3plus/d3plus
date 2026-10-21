import tseslint from "typescript-eslint";
import globals from "globals";
import storybook from "eslint-plugin-storybook";

import js from "@eslint/js";
export default [
  js.configs.recommended,
  {
    // New in ESLint 10's recommended set; warns until the existing dead
    // assignments are cleaned up.
    rules: {"no-useless-assignment": "warn"},
  },
  {
    // Build output and the manual dev pages.
    ignores: [
      "**/{es,umd,types,dist,build,coverage}/**",
      "packages/*/dev/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
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
    // Package entry points are export lists, not code: they grow by a line or
    // two with every new export, so they're exempt from file size, and may
    // hold only imports and re-exports so they stay that way.
    files: ["packages/core/internal.ts", "packages/core/umd-entry.ts", "packages/*/index.ts"],
    ignores: ["packages/{element,svelte,vue}/index.ts"],
    rules: {
      "max-lines": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program > :not(ImportDeclaration, ExportAllDeclaration, ExportNamedDeclaration:not([declaration]))",
          message: "Package entry points hold only imports and re-exports; put code in src/.",
        },
      ],
    },
  },
  {
    // Translation/data dictionaries are data, not code — exempt from file size,
    // as is the config type, which declares one property per config key.
    files: ["packages/locales/**/*.ts", "packages/core/src/utils/D3plusConfig.ts"],
    rules: {
      "max-lines": "off",
    },
  },
  {
    // Storybook stories, args, helpers, and config. The generated story header
    // always imports React and funcify, whether or not the stories below the
    // marker use them.
    files: ["packages/docs/**/*.jsx"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {jsx: true},
      },
    },
    rules: {
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
        describe: "readonly",
        it: "readonly",
        before: "readonly",
        after: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
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
      // Tests may name the globals they rely on in a `/* global … */` comment
      // even when the environment already provides them.
      "no-redeclare": ["error", {builtinGlobals: false}],
    },
  },
];
