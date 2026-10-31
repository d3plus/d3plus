import {format, formatDefaultLocale} from "@d3plus/format";

formatDefaultLocale({
  decimal: ",",
  thousands: ".",
  grouping: [3],
  currency: ["", "\u00a0€"],
});
format(",.2f")(1234567.891);
format("$,.2f")(1234567.891);
