process = require "../../core/methods/process/icon.coffee"

module.exports =
  accepted: [Boolean]
  align:    "middle"
  hover:
    accepted: ["all-scroll", "col-resize", "crosshair", "default", "grab", "grabbing", "move", "pointer"]
    value:    "pointer"
  handles:
    accepted: [Boolean]
    color:    "#e5e5e5"
    hover:    "#cccccc"
    opacity:  1
    size:     2
    stroke:   "#818181"
    value:    true
  height:
    accepted: [Number]
    value:    23
  play:
    accepted: [Boolean]
    icon:
      accepted: [false, String]
      fallback: "►"
      process:  process
      rotate:   0
      value:    "fa-play"
    pause:
      accepted: [false, String]
      fallback: "❚❚"
      process:  process
      rotate:   0
      value:    "fa-pause"
    timing:
      accepted: [Number]
      value:    1500
    value:    true
  tick:  "#818181"
  value: true
