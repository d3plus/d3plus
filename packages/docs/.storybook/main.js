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

  addons: [
    getAbsolutePath("@storybook/addon-controls"), 
    {
      name: getAbsolutePath("@storybook/addon-docs"),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    }
  ],

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
        if (name !== "docs") aliases[`@d3plus/${name}`] = path.resolve(__dirname, "../", folder);
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