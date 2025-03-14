import remarkGfm from "remark-gfm";

module.exports = {
  stories: [
    "../docs/**/*.mdx", 
    "../packages/**/*.stories.@(mdx|js|jsx|ts|tsx)"
  ],

  addons: [
    "@storybook/addon-controls", 
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    }
  ],

  framework: "@storybook/nextjs",

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
  }

};