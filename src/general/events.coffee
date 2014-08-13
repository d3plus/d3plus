###*
 * Creates custom mouse events based on IE and Touch Devices.
 ###
d3plus.touch = if ("ontouchstart" of window) or window.DocumentTouch and document instanceof DocumentTouch then true else false
if d3plus.touch
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
    over: if d3plus.ie then "mouseenter" else "mouseover"
    out: if d3plus.ie then "mouseleave" else "mouseout"
    move: "mousemove"
