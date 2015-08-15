module.exports =
  accepted: [Boolean]
  align:    "middle"
  hover:
    accepted: ["all-scroll", "col-resize", "crosshair", "default", "grab", "grabbing", "move", "pointer"]
    value:    "pointer"
  handles:
    accepted: [Boolean]
    color:    "#666"
    opacity:  1
    size:     3
    stroke:   "#666"
    value:    true
  height:
    accepted: [false, Number]
    value:    false
  play:
    accepted: [Boolean]
    icon:
      accepted: [false, String]
      awesome:  ""
      fallback: "►"
    pause:
      accepted: [false, String]
      awesome:  ""
      fallback: "❚❚"
    timing:
      accepted: [Number]
      value:    1500
    value:    true
  value: true
