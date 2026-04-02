import react from "eslint-plugin-react";
import tseslint from "typescript-eslint";
export default [
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
