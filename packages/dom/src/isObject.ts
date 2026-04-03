/**
    Detects if a variable is a javascript Object.
    @param item The value to test.
*/
export default function (item: unknown): boolean {
  return item &&
    typeof item === "object" &&
    (typeof window === "undefined" ||
      (item !== window &&
        item !== window.document &&
        !(item instanceof Element))) &&
    !Array.isArray(item)
    ? true
    : false;
}
