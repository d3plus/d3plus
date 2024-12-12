import React, { useCallback } from "react";

import { FORCE_RE_RENDER } from '@storybook/core-events';
import { useGlobals } from '@storybook/manager-api';
import { addons, types } from "@storybook/addons";
import { Icons, IconButton } from "@storybook/components";

const ADDON_ID = 'addons-showCode';

addons.register(ADDON_ID, () => {
  addons.add(ADDON_ID, {
    title: "Show Config",
    type: types.TOOL,
    match: ({ viewMode }) => !!(viewMode && viewMode === "story"),
    render: () => {

      const [{ showCode }, updateGlobals] = useGlobals();
      
      // Function that will update the global value and trigger a UI refresh.
      const refreshAndUpdateGlobal = () => {
        // Updates Storybook global value
        updateGlobals({
          showCode: !showCode,
        }),
          // Invokes Storybook's addon API method (with the FORCE_RE_RENDER) event to trigger a UI refresh
          addons.getChannel().emit(FORCE_RE_RENDER);
      };
    
      const toggleOutline = useCallback(() => refreshAndUpdateGlobal(), [showCode]);

      return (
        <IconButton
          active={showCode}
          onClick={toggleOutline}
        >
          <Icons icon="markup" />&nbsp;&nbsp;Show Config
        </IconButton>
      )},
  });
});