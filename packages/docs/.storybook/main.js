import remarkGfm from "remark-gfm";
import path from "node:path";
import fs from "node:fs";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import webpack from "webpack";

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
    name: getAbsolutePath("@storybook/nextjs"),
    options: {
      builder: {useSWC: true},
    },
  },

  docs: {
    defaultName: "D3plus",
  },

  staticDirs: ["../static"],

  typescript: {
    reactDocgen: "react-docgen-typescript",
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },

  webpackFinal: async config => {
    if (config.resolve) {
      const packagesDir = path.resolve(__dirname, "../..");
      const folders = fs
        .readdirSync(packagesDir, {withFileTypes: true})
        .filter(d => d.isDirectory() && d.name !== "docs");

      const workspacePackages = folders.reduce((aliases, dirent) => {
        const name = dirent.name;
        const filename = name === "react" ? "index.tsx" : "index.ts";
        aliases[`@d3plus/${name}`] = path.resolve(packagesDir, name, filename);
        return aliases;
      }, {});

      config.resolve.alias = {
        ...workspacePackages,
        ...config.resolve.alias,
        // The `@d3plus/ssr` stories document the server-rendering API, but its
        // Node-only runtime deps (`jsdom`, `@napi-rs/canvas`) are loaded via
        // lazy `import()` that never executes in the browser preview. Stub them
        // to empty modules so webpack doesn't try to bundle jsdom (which drags
        // in the Node built-ins `net`/`tls`/`child_process`/`fs`).
        jsdom: false,
        "@napi-rs/canvas": false,
        // `@d3plus/ssr`'s geomap-tile SSRF guard statically imports `undici`
        // (unlike jsdom/canvas, not behind a lazy `import()`). Stub it the
        // same way — it pulls in a long tail of `node:*` builtins (zlib,
        // http2, sqlite, …) that webpack's "unhandled scheme" resolver
        // otherwise rejects outright.
        undici: false,
      };

      // Belt-and-suspenders for any Node core module reached before the aliases
      // above short-circuit: resolve them to nothing in the browser bundle.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        child_process: false,
        fs: false,
        dns: false,
      };

      // webpack resolves a `node:`-scheme request (e.g. the geomap-tile SSRF
      // guard's `import net from "node:net"`) through its scheme handler
      // instead of the alias/fallback maps above, which only match bare
      // specifiers — so strip the prefix first and let `net`/`dns` above
      // catch it.
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, resource => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );

      // TypeScript sources use .js extensions in imports (ESM convention);
      // tell webpack to also try .ts/.tsx when it sees .js/.jsx
      config.resolve.extensionAlias = {
        ".js": [".ts", ".tsx", ".js"],
        ".jsx": [".tsx", ".jsx"],
        ...config.resolve.extensionAlias,
      };
    }
    return config;
  },
};
