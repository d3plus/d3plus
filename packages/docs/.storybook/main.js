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
      };

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
