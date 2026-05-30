import tseslint from "typescript-eslint";

import js from "@eslint/js";
export default [
  js.configs.recommended,
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
      },
    },
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
];
