import {addons} from "@storybook/manager-api";
import theme from "./theme.js";

addons.setConfig({
  navSize: 250,
  sidebar: {
    collapsedRoots: ["color"],
  },
  theme
});
