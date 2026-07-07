import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";
export default [
  {
    // Generated output — the bare `eslint` invocation would otherwise lint the
    // coverage report's bundled JS and flag its eslint-disable directives.
    ignores: ["coverage/**", "es/**", "umd/**", "types/**"],
  },
  {
    files: ["index.tsx", "src/**/*.tsx"],
    plugins: {
      react,
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      globals: {
        browser: true,
        node: true,
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
];
