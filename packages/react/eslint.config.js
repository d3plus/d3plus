import react from "eslint-plugin-react";
export default {
  files: ["index.js", "src/**/*.js", "src/**/*.jsx"],
  plugins: {
    react
  },
  languageOptions: {
    globals: {
      browser: true,
      node: true
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      }
    }
  }
};