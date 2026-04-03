export interface ParsedSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 Converts a string of directional CSS shorthand values into an object with the values expanded.
 @param sides The CSS shorthand string to expand.
 */
export default function (sides: string | number): ParsedSides {
  let values: string[];
  if (typeof sides === "number") values = [`${sides}`];
  else values = sides.split(/\s+/);

  if (values.length === 1)
    values = [values[0], values[0], values[0], values[0]];
  else if (values.length === 2) values = values.concat(values);
  else if (values.length === 3) values.push(values[1]);

  return ["top", "right", "bottom", "left"].reduce((acc, direction, i) => {
    const value = parseFloat(values[i]);
    acc[direction as keyof ParsedSides] = value || 0;
    return acc;
  }, {} as ParsedSides);
}
