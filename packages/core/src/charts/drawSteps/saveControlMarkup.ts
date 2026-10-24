/**
    Markup and styling for the download button (`saveControl.ts`): a toggle
    button and the menu of file formats it opens.

    The menu's open state lives only in the DOM (its `display` and the
    button's `aria-expanded`), never in the generated html, so opening it
    neither changes the panel's measured size nor makes the next repaint
    rewrite the open menu.

    @module
*/
import type {SaveFormat} from "../../utils/D3plusConfig.js";
import type Viz from "../viz/Viz.js";
import {
  controlButtonStyles,
  escapeHtml,
  kebab,
  paintControlButton,
  resolveControlStyle,
  type ControlButtonStyles,
  type ControlStyleValue,
  type StyleObject,
} from "./controlButtonStyle.js";
import {saveFormats} from "./saveChart.js";
import {DOWNLOAD_ICON} from "./tableViewMarkup.js";
import {
  saveControlMenuItemStyleDefault,
  saveControlMenuItemStyleHoverDefault,
  saveControlMenuStyleDefault,
  saveControlStyleActiveDefault,
  saveControlStyleDefault,
  saveControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/** The English label of each format's menu item, translated through `translate`. */
export const SAVE_FORMAT_LABELS: Record<SaveFormat, string> = {
  png: "PNG image",
  svg: "SVG vector",
  jpg: "JPG image",
};

/** The formats a chart's download button offers. */
function chartSaveFormats(viz: Viz): SaveFormat[] {
  return saveFormats(viz.schema.saveControlConfig?.formats);
}

/** Whether a chart shows the download button. */
export function showsSaveControl(viz: Viz): boolean {
  return (
    Boolean(viz.schema.saveControl) &&
    !viz._ssr &&
    chartSaveFormats(viz).length > 0
  );
}

/** The resolved base / active / hover styles of the download button. */
export function saveButtonStyles(viz: Viz): ControlButtonStyles {
  return controlButtonStyles(viz.schema, "saveControl", {
    base: saveControlStyleDefault,
    active: saveControlStyleActiveDefault,
    hover: saveControlStyleHoverDefault,
  });
}

/** Paints the download button's inline style for its state (base, hover, menu open). */
export function paintSaveButton(
  viz: Viz,
  btn: HTMLElement,
  hovered = false,
): void {
  paintControlButton(
    btn,
    saveButtonStyles(viz),
    hovered,
    btn.classList.contains("active"),
  );
}

const ROOT_STYLE: Record<string, string> = {
  position: "relative",
  display: "inline-flex",
  "align-items": "center",
};

/** The menu's fixed layout while closed; `SAVE_MENU_OPEN_STYLE` shows it. */
export const SAVE_MENU_STYLE: StyleObject = {
  position: "absolute",
  top: "100%",
  left: "0",
  "z-index": "1",
  display: "none",
  "flex-direction": "column",
  "min-width": "max-content",
};
export const SAVE_MENU_OPEN_STYLE: StyleObject = {display: "flex"};

/** Each menu item's fixed layout. */
const ITEM_STYLE: StyleObject = {
  display: "block",
  width: "100%",
  "text-align": "start",
  "white-space": "nowrap",
  cursor: "pointer",
};

/** The menu's and its items' resolved theme styles. */
export interface SaveMenuStyles {
  menu: StyleObject;
  item: StyleObject;
  itemHover: StyleObject;
}

/**
    Resolves `saveControlMenuStyle`, `saveControlMenuItemStyle`, and
    `saveControlMenuItemStyleHover`, with `saveControlMenuClassName`
    dropping whichever are still the defaults.
*/
export function saveMenuStyles(viz: Viz): SaveMenuStyles {
  const className = Boolean(viz.schema.saveControlMenuClassName);
  const style = (key: string, fallback: ControlStyleValue): StyleObject =>
    resolveControlStyle(
      viz.schema[key] as ControlStyleValue,
      fallback,
      className,
    );
  return {
    menu: style("saveControlMenuStyle", saveControlMenuStyleDefault),
    item: style("saveControlMenuItemStyle", saveControlMenuItemStyleDefault),
    itemHover: style(
      "saveControlMenuItemStyleHover",
      saveControlMenuItemStyleHoverDefault,
    ),
  };
}

/** Paints a menu item's inline style, with the hover style while it has focus. */
export function paintSaveMenuItem(
  viz: Viz,
  item: HTMLElement,
  focused: boolean,
): void {
  const {item: base, itemHover: hover} = saveMenuStyles(viz);
  paintControlButton(
    item,
    {base: {...base, ...ITEM_STYLE}, hover},
    focused,
    false,
  );
}

function styleAttr(...styles: StyleObject[]): string {
  return styles
    .flatMap(style => Object.entries(style))
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => `${kebab(k)}:${escapeHtml(v)}`)
    .join(";");
}

/**
    The button's markup, plus its menu when more than one format is offered.
    With one format, the button saves it directly and names it in its label.
*/
export function saveControlHtml(viz: Viz): string {
  const formats = chartSaveFormats(viz);
  const translate = (text: string): string => viz.schema.translate(text);
  const download = translate("Download");
  const extraClass = viz.schema.saveControlClassName
    ? ` ${escapeHtml(viz.schema.saveControlClassName)}`
    : "";
  const button = (label: string, attrs: string): string =>
    `<button type="button" class="save-control save-toggle${extraClass}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}"${attrs}>${DOWNLOAD_ICON}</button>`;

  if (formats.length === 1) {
    const label = `${download} (${translate(SAVE_FORMAT_LABELS[formats[0]])})`;
    return `<span class="save-root" style="${styleAttr(ROOT_STYLE)}">${button(label, ` data-format="${formats[0]}"`)}</span>`;
  }
  const styles = saveMenuStyles(viz);
  const itemStyle = styleAttr(styles.item, ITEM_STYLE);
  const menuClass = viz.schema.saveControlMenuClassName
    ? ` ${escapeHtml(viz.schema.saveControlMenuClassName)}`
    : "";
  const items = formats
    .map(
      format =>
        `<button type="button" role="menuitem" tabindex="-1" class="save-menu-item" data-format="${format}" style="${itemStyle}">${escapeHtml(translate(SAVE_FORMAT_LABELS[format]))}</button>`,
    )
    .join("");
  return (
    `<span class="save-root" style="${styleAttr(ROOT_STYLE)}">` +
    button(download, ' aria-haspopup="menu" aria-expanded="false"') +
    `<span class="d3plus-save-menu${menuClass}" role="menu" aria-label="${escapeHtml(download)}" style="${styleAttr(styles.menu, SAVE_MENU_STYLE)}">${items}</span>` +
    `</span>`
  );
}
