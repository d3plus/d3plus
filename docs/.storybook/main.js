import remarkGfm from "remark-gfm";

module.exports = {
  stories: [
    "../docs/**/*.stories.mdx", 
    "../charts/**/*.stories.@(mdx|js|jsx|ts|tsx)", 
    "../advanced/**/*.stories.@(mdx|js|jsx|ts|tsx)"
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
    "./addons-showCode/register"
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {}
  },
  docs: {
    autodocs: true,
    canvas: {
      sourceState: "shown"
    },
    defaultName: "Documentation"
  },
  staticDirs: ["../static"]
};