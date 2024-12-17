import remarkGfm from "remark-gfm";

module.exports = {
  stories: [
    "../docs/**/*.mdx", 
    "../charts/**/*.stories.@(mdx|js|jsx|ts|tsx)"
  ],

  addons: [
    "@storybook/addon-links", 
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
    }, 
    "@storybook/addon-webpack5-compiler-swc"
  ],

  framework: "@storybook/react-webpack5",

  docs: {
    defaultName: "D3plus"
  },

  staticDirs: ["../static"],

  typescript: {
    reactDocgen: "react-docgen-typescript"
  },

  core: {
    disableTelemetry: true, // 👈 Disables telemetry
  }

};