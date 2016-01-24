ie    = require "./ie.js"
touch = require "./touch.coffee"

# Creates custom mouse events based on IE and Touch Devices.
if touch
  module.exports =
    click: "click"
    down: "touchstart"
    up: "touchend"
    over: if ie then "mouseenter" else "mouseover"
    out: if ie then "mouseleave" else "mouseout"
    move: "mousemove"
else
  module.exports =
    click: "click"
    down: "mousedown"
    up: "mouseup"
    over: if ie then "mouseenter" else "mouseover"
    out: if ie then "mouseleave" else "mouseout"
    move: "mousemove"
