import {colorValidate, colorRamp, colorDefaults} from "@d3plus/color";

colorValidate(colorRamp(colorDefaults.sequential, 5, {ordinal: true}), {
  ordinal: true,
});
