import react from "eslint-plugin-react";
export default {
  files: ["index.jsx", "src/**/*.jsx"],
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