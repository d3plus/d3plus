import {addons} from "storybook/manager-api";

const SITE_TITLE = "D3plus";

addons.register("Title", api => {

  const setTitle = () => {
    
    try {
      const storyData = api.getCurrentStoryData();
      const prefix = storyData.title ? storyData.title.replace(/\//g, ' / ') : false;
      document.title = prefix ? `${prefix} - ${SITE_TITLE}` : SITE_TITLE;
    } 
    catch (e) {
      document.title = SITE_TITLE;
    }
    
  }

  const detector = () => {
    if (document.title.endsWith("Storybook")) setTitle();
  };

  const elem = document.querySelector("title");

  const observerOpts = {childList: true, subtree: true, characterData: true};

  return new MutationObserver(detector).observe(elem, observerOpts);

});