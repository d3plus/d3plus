//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Creates custom mouse events based on IE and Touch Devices.
//------------------------------------------------------------------------------
d3plus.evt = {}

// Modernizr touch events
d3plus.touch = window.Modernizr && Modernizr.touch

if (d3plus.touch) {

  d3plus.evt.click = "click"
  d3plus.evt.down  = "touchstart"
  d3plus.evt.up    = "touchend"
  d3plus.evt.over  = "touchstart"
  d3plus.evt.out   = "touchend"
  d3plus.evt.move  = "touchmove"

}
else {

  d3plus.evt.click = "click"
  d3plus.evt.down  = "mousedown"
  d3plus.evt.up    = "mouseup"

  if (d3plus.ie) {

    d3plus.evt.over = "mouseenter"
    d3plus.evt.out  = "mouseleave"

  }
  else {

    d3plus.evt.over = "mouseover"
    d3plus.evt.out  = "mouseout"

  }

  d3plus.evt.move = "mousemove"

}
