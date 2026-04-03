/**
    Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".
*/
export default function (): boolean {
  return (
    document.documentElement.dir === "rtl" ||
    document.body.dir === "rtl" ||
    getComputedStyle(document.documentElement).direction === "rtl" ||
    getComputedStyle(document.body).direction === "rtl"
  );
}
