import {defineConfig} from "vite";
import angular from "@analogjs/vite-plugin-angular";

// Angular can't run under plain Vite/esbuild (its components need the Angular
// compiler), so the dev harness compiles through @analogjs/vite-plugin-angular.
export default defineConfig({
  plugins: [angular()],
});
