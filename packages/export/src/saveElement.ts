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
    Resolves the save + render options: applies the `filename`/`type` defaults
    and renames `renderOptions.background` to `backgroundColor` for backwards
    compatibility. Pure (no DOM), so the option handling is unit-testable apart
    from the third-party rasterization.
*/
export function resolveSaveOptions(
  options: SaveElementOptions = {},
  renderOptions: SaveElementRenderOptions = {},
): {
  filename: string;
  type: "png" | "jpg" | "svg";
  renderOpts: SaveElementRenderOptions;
} {
  const {filename, type} = Object.assign({}, defaultOptions, options);
  const renderOpts = Object.assign(
    {backgroundColor: renderOptions.background},
    renderOptions,
  );
  return {filename, type, renderOpts};
}

/**
    Downloads an HTML Element as a bitmap PNG image.
    @param elem The DOM element or d3 selection to export.
    @param options Additional options to specify.
    @param options .filename = "download"] Filename for the downloaded file, without the extension.
    @param options .type = "png"] File type of the saved document. Accepted values are `"png"` and `"jpg"`.
    @param options .callback] Function to be invoked after saving is complete.
    @param renderOptions Custom options to be passed to the html-to-image function.
*/
export default function (
  elem: HTMLElement,
  options: SaveElementOptions = {},
  renderOptions: SaveElementRenderOptions = {},
): void {
  if (!elem) return;
  const {filename, type, renderOpts} = resolveSaveOptions(options, renderOptions);

  function finish(blob: Blob): void {
    saveAs(blob, `${filename}.${type}`);
    if (options.callback) options.callback();
  }

  if (type === "svg") {
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
