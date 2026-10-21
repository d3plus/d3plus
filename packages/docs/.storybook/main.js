import remarkGfm from "remark-gfm";
import path from "node:path";
import fs from "node:fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// monorepo fix
// https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
const getAbsolutePath = packageName =>
  path.dirname(require.resolve(path.join(packageName, "package.json")));

export default {
  stories: [
    "../docs/**/*.mdx",
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)",
  ],

  addons: [
    {
      name: getAbsolutePath("@storybook/addon-docs"),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],

  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {},
  },

  docs: {
    defaultName: "D3plus",
  },

  staticDirs: ["../static"],

  typescript: {
    reactDocgen: "react-docgen",
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },

  viteFinal: async config => {
    const packagesDir = path.resolve(__dirname, "../..");
    const workspacePackages = fs
      .readdirSync(packagesDir, {withFileTypes: true})
      .filter(d => d.isDirectory() && d.name !== "docs")
      .map(({name}) => ({
        find: new RegExp(`^@d3plus/${name}$`),
        replacement: path.resolve(packagesDir, name, name === "react" ? "index.tsx" : "index.ts"),
      }));

    // The `@d3plus/ssr` stories document the server-rendering API. Its
    // Node-only runtime deps never run in the browser preview, so they
    // resolve to an empty module.
    const empty = path.resolve(__dirname, "empty.js");
    const nodeOnly = ["jsdom", "@napi-rs/canvas", "undici", "node:dns", "node:net"].map(name => ({
      find: new RegExp(`^${name}$`),
      replacement: empty,
    }));

    config.resolve = config.resolve || {};
    config.resolve.alias = [
      {find: /^@d3plus\/types\/react$/, replacement: path.resolve(packagesDir, "types", "react.ts")},
      ...workspacePackages,
      ...nodeOnly,
      ...(Array.isArray(config.resolve.alias) ? config.resolve.alias : []),
    ];

    // "Show code" names each story's component after its function, so
    // minification has to keep function names. The preview bundles every
    // package and chart, so one chunk is large by design; @d3plus/react's
    // "use client" directives are for React Server Components and don't
    // apply to the preview.
    config.build = {
      ...config.build,
      chunkSizeWarningLimit: 4096,
      rolldownOptions: {
        ...config.build?.rolldownOptions,
        output: {...config.build?.rolldownOptions?.output, keepNames: true},
        onwarn(warning, warn) {
          if (["MODULE_LEVEL_DIRECTIVE", "PLUGIN_TIMINGS", "SOURCEMAP_ERROR"].includes(warning.code)) return;
          warn(warning);
        },
      },
    };
    return config;
  },
};
