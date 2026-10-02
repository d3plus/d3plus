import {addons} from "storybook/manager-api";

addons.register("Favicon", () => {
  const setFavicon = () => {
    const elem = document.querySelector("link[rel='icon']");
    elem.href = "/images/favicon.ico?v=4";
    elem.type = "image/png";
    elem.sizes = "256x256";
  };

  const detector = () => {
    const elem = document.querySelector("link[rel='icon']");
    if (elem && elem.href.endsWith("favicon.svg")) setFavicon();
  };

  const observerOpts = {childList: true, subtree: true, characterData: true};

  return new MutationObserver(detector).observe(document.head, observerOpts);
});
