import {addons} from "@storybook/manager-api";
import theme from "./theme.js";

addons.setConfig({
  sidebar: {
    collapsedRoots: ["color"]
  },
  theme
});
