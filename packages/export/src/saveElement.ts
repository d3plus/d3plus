import {toBlob, toSvg} from "html-to-image";
import {saveAs} from "file-saver";

export interface SaveElementOptions {
  /** Filename for the downloaded file, without the extension. */
  filename?: string;
  /** File type of the saved document. Accepted values are "png", "jpg", and "svg". */
  type?: "png" | "jpg" | "svg";
  /** Function to be invoked after saving is complete. */
  callback?: () => void;
}

export interface SaveElementRenderOptions {
  /** Background color for the rendered image. */
  background?: string;
  /** Background color for the rendered image (alias). */
  backgroundColor?: string;
  [key: string]: unknown;
}

const defaultOptions: Required<Pick<SaveElementOptions, "filename" | "type">> =
  {
    filename: "download",
    type: "png",
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
export default function (
  elem: HTMLElement,
  options: SaveElementOptions = {},
  renderOptions: SaveElementRenderOptions = {},
): void {
  if (!elem) return;
  const opts = Object.assign({}, defaultOptions, options);

  // rename renderOptions.background to backgroundColor for backwards compatibility
  const renderOpts = Object.assign(
    {backgroundColor: renderOptions.background},
    renderOptions,
  );

  function finish(blob: Blob): void {
    saveAs(blob, `${opts.filename}.${opts.type}`);
    if (opts.callback) opts.callback();
  }

  if (opts.type === "svg") {
    toSvg(elem, renderOpts).then((dataUrl: string) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", dataUrl);
      xhr.responseType = "blob";
      xhr.onload = () => finish(xhr.response as Blob);
      xhr.send();
    });
  } else {
    toBlob(elem, renderOpts).then((blob: Blob | null) => {
      if (blob) finish(blob);
    });
  }
}
