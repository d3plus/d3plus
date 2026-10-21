import {register} from "node:module";

// Loaded by .mocharc.json before any test file, so `es/` resolves
// html-to-image and saveElement's saveBlob to the fakes beside this file.
register("./hooks.js", import.meta.url);
