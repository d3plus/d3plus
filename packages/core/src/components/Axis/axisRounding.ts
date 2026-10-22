/**
    Axis domain rounding: how an Axis with `rounding` "outside" or "inside"
    widens or narrows a linear or log domain to "nice" values. Pure.

    @module
*/
import {max} from "d3-array";

/** Whether `d` is negative, counting -0. */
export const isNegative = (d: number): boolean => d < 0 || Object.is(d, -0);
/** The power of ten at or below `|d|`, carrying `d`'s sign. */
export const floorPow = (d: number): number =>
  Math.pow(10, Math.floor(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
/** The power of ten at or above `|d|`, carrying `d`'s sign. */
export const ceilPow = (d: number): number =>
  Math.pow(10, Math.ceil(Math.log10(Math.abs(d)))) *
  Math.pow(-1, isNegative(d) ? 1 : 0);
/** `d` with floating-point noise (runs of 0s or 9s) trimmed; tiny values become 0. */
export const fixFloat = (d: number): number => {
  const str = `${d}`;
  if (str.includes("e-") || str === "0") return 0;
  const nineMatch = str.match(/(-*[0-9]+\.[0]*)([0-8]+)9{3,}[0-9]+$/);
  if (nineMatch) return +`${nineMatch[1]}${+nineMatch[2] + 1}`;
  const zeroMatch = str.match(/(-*[0-9]+\.[0]*)([1-9]+)0*[0-9]*0{3,}[0-9]+$/);
  if (zeroMatch) return +`${zeroMatch[1]}${+zeroMatch[2]}`;
  return d;
};

/** A linear domain rounded to "nice" values per the rounding mode, or undefined when it has no digits to round. */
function roundLinear(
  initialDomain: number[],
  rounding: string,
  scale: string,
): number[] | undefined {
  const zeroLength = (d: number) => {
    if (smallScale) {
      if (!d) return 0;
      const m = `${d}`.match(/0\.(0*)/);
      if (m)
        return +`0.${Array(m[1].length + 1)
          .fill(0)
          .join("")}1`;
    }
    return `${Math.round(Math.abs(d))}`.length;
  };
  const smallScale = initialDomain.every((d: number) => Math.abs(d) < 1);
  const zeroArray = [zeroLength(initialDomain[0]), zeroLength(initialDomain[1])]
    .filter(Boolean)
    .sort();
  if (!zeroArray.length) return undefined;
  const diverging =
    initialDomain.some((d: number) => isNegative(d)) &&
    initialDomain.some((d: number) => d > 0);
  const zeros =
    zeroArray.length === 1
      ? zeroArray[0]
      : zeroArray[0] > 1 && zeroArray[0] === zeroArray[1]
        ? zeroArray[0] - 1
        : rounding === "outside" || !diverging
          ? zeroArray[0] + (zeroArray[1] - zeroArray[0]) / 2
          : max(zeroArray)!;
  let factor: number =
    zeros < 1
      ? fixFloat(zeros)
      : +`1${Array(Math.floor(fixFloat(zeros)) - 1)
          .fill(0)
          .join("")}`;
  if (factor >= Math.abs(initialDomain[1] - initialDomain[0])) factor /= 2;
  const inverted = initialDomain[1] < initialDomain[0];
  const newDomain = [
    Math[
      rounding === "outside"
        ? inverted
          ? "ceil"
          : "floor"
        : inverted
          ? "floor"
          : "ceil"
    ](initialDomain[0] / factor) * factor,
    Math[
      rounding === "outside"
        ? inverted
          ? "floor"
          : "ceil"
        : inverted
          ? "ceil"
          : "floor"
    ](initialDomain[1] / factor) * factor,
  ];
  if (scale === "log") {
    if (newDomain[0] === 0) newDomain[0] = initialDomain[0];
    if (newDomain[1] === 0) newDomain[1] = initialDomain[1];
  }
  return newDomain.map(fixFloat);
}

/**
    A linear or log axis domain rounded the way an Axis with this `rounding`
    ("outside" or "inside") rounds it, or undefined when the axis leaves the
    domain as given (another scale, or nothing to round).
*/
export function roundedDomain(
  initialDomain: number[],
  rounding: string,
  scale: string,
): number[] | undefined {
  if (scale === "linear") {
    return roundLinear(initialDomain, rounding, scale);
  } else if (scale === "log") {
    const powDomain: number[] = [];
    const inverted = initialDomain[1] < initialDomain[0];
    powDomain[0] = (
      rounding === "outside"
        ? isNegative(initialDomain[0])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? ceilPow
            : floorPow
        : isNegative(initialDomain[0])
          ? inverted
            ? ceilPow
            : floorPow
          : inverted
            ? floorPow
            : ceilPow
    )(initialDomain[0]);
    powDomain[1] = (
      rounding === "inside"
        ? isNegative(initialDomain[1])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? ceilPow
            : floorPow
        : isNegative(initialDomain[1])
          ? inverted
            ? floorPow
            : ceilPow
          : inverted
            ? floorPow
            : ceilPow
    )(initialDomain[1]);
    const powInverted = powDomain[1] < powDomain[0];
    if (
      powDomain[0] !== powDomain[1] &&
      powDomain.some((d: number) => Math.abs(d) > 10) &&
      powInverted === inverted
    ) {
      return powDomain;
    }
    return roundLinear(initialDomain, rounding, scale);
  }
  return undefined;
}
