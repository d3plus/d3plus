import remarkGfm from "remark-gfm";
import path from "node:path";
import glob from "glob";

// monorepo fix
// https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
const getAbsolutePath = packageName =>
  path.dirname(require.resolve(path.join(packageName, 'package.json')));

module.exports = {
  stories: [
    "../docs/**/*.mdx", 
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)"
  ],

  addons: [{
    name: getAbsolutePath("@storybook/addon-docs"),
    options: {
      mdxPluginOptions: {
        mdxCompileOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
    },
  }],

  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {
      builder: {useSWC: true}
    }
  },

  docs: {
    defaultName: "D3plus"
  },

  staticDirs: ["../static"],

  typescript: {
    reactDocgen: "react-docgen-typescript"
  },

  core: {
    disableTelemetry: true, // 👈 Disables telemetry
    disableWhatsNewNotifications: true,
  },

  webpackFinal: async (config) => {
    if (config.resolve) {
      
      const workspacePackages = glob.sync('../*/').reduce((aliases, folder) => {
        const name = path.basename(folder);
        if (name !== "docs") {
          const filename = name === "react" ? "index.jsx" : "index.js";
          aliases[`@d3plus/${name}`] = path.resolve(__dirname, "../", folder, filename);
        }
        return aliases;
      }, {});

      config.resolve.alias = {
        ...workspacePackages,
        ...config.resolve.alias
      };
    }
    return config;
  }

};