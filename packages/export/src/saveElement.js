import {toBlob, toSvg} from "html-to-image";
import {saveAs} from "file-saver";

const defaultOptions = {
  filename: "download",
  type: "png"
};

/**
    @function saveElement
    @desc Downloads an HTML Element as a bitmap PNG image.
    @param {HTMLElement} elem A single element to be saved to one file.
    @param {Object} [options] Additional options to specify.
    @param {String} [options.filename = "download"] Filename for the downloaded file, without the extension.
    @param {String} [options.type = "png"] File type of the saved document. Accepted values are `"png"` and `"jpg"`.
    @param {Function} [options.callback] Function to be invoked after saving is complete.
    @param {Object} [renderOptions] Custom options to be passed to the html-to-image function.
*/
export default function(elem, options = {}, renderOptions = {}) {

  if (!elem) return;
  options = Object.assign({}, defaultOptions, options);

  // rename renderOptions.background to backgroundColor for backwards compatibility
  renderOptions = Object.assign({backgroundColor: renderOptions.background}, renderOptions);

  function finish(blob) {
    saveAs(blob, `${options.filename}.${options.type}`);
    if (options.callback) options.callback();
  }

  if (options.type === "svg") {

    toSvg(elem, renderOptions)
      .then(dataUrl => {

        const xhr = new XMLHttpRequest();
        xhr.open("GET", dataUrl);
        xhr.responseType = "blob";
        xhr.onload = () => finish(xhr.response);
        xhr.send();

      });

  }
  else {

    toBlob(elem, renderOptions)
      .then(finish);

  }

}
