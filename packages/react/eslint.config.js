import react from "eslint-plugin-react";
export default {
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