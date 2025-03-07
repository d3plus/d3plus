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