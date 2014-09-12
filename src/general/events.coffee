ie    = require "./ie.js"
touch = require "./touch.coffee"

# Creates custom mouse events based on IE and Touch Devices.
if touch
  d3plus.evt =
    click: "click"
    down: "touchstart"
    up: "touchend"
    over: "touchstart"
    out: "touchend"
    move: "touchmove"
else
  d3plus.evt =
    click: "click"
    down: "mousedown"
    up: "mouseup"
    over: if ie then "mouseenter" else "mouseover"
    out: if ie then "mouseleave" else "mouseout"
    move: "mousemove"

module.exports = d3plus.evt
