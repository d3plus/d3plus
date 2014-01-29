var d3plus = window.d3plus || {};
window.d3plus = d3plus;

d3plus.version = "1.1.1 - Navy";

d3plus.ie = /*@cc_on!@*/false;

d3plus.fontawesome = false

var sheets = document.styleSheets
    
for (var s = 0; s < sheets.length; s++) {
  if (sheets[s].href && sheets[s].href.indexOf("font-awesome") >= 0) {
    d3plus.fontawesome = true
    break;
  }
}

d3plus.evt = {}; // stores all mouse events that could occur

// Modernizr touch events
if (window.Modernizr && Modernizr.touch) {
  d3plus.evt.click = "touchend"
  d3plus.evt.down = "touchstart"
  d3plus.evt.up = "touchend"
  d3plus.evt.over = "touchstart"
  d3plus.evt.out = "touchend"
  d3plus.evt.move = "touchmove"
} else {
  d3plus.evt.click = "click"
  d3plus.evt.down = "mousedown"
  d3plus.evt.up = "mouseup"
  if (d3plus.ie) {
    d3plus.evt.over = "mouseenter"
    d3plus.evt.out = "mouseleave"
  }
  else {
    d3plus.evt.over = "mouseover"
    d3plus.evt.out = "mouseout"
  }
  d3plus.evt.move = "mousemove"
}

// Modernizr SVG Capable Detect
d3plus.svg = true
if (window.Modernizr && Modernizr.svg === false) {
  d3plus.svg = false
}

d3plus.apps = {};
d3plus.color = {};
d3plus.console = {};
d3plus.data = {};
d3plus.shape = {};
d3plus.styles = {};
d3plus.tooltip = {};
d3plus.utils = {};
d3plus.ui = {};
d3plus.variable = {};
d3plus.zoom = {};

d3plus.console.print = function(type,message,style) {
  if (d3plus.ie) console.log("[d3plus] "+message)
  else console[type]("%c[d3plus]%c "+message,"font-weight:bold;",style)
}
d3plus.console.log = function(message,style) {
  if (!style) var style = "font-weight:bold;"
  d3plus.console.print("log",message,style)
}
d3plus.console.group = function(message,style) {
  if (!style) var style = "font-weight:bold;"
  d3plus.console.print("group",message,style)
}
d3plus.console.warning = function(message,style) {
  if (!style) var style = "font-weight:bold;color:red;"
  message = "WARNING: "+message
  d3plus.console.print("log",message,style)
}
d3plus.console.groupEnd = function() {
  if (!d3plus.ie) console.groupEnd()
}
d3plus.console.time = function(message) {
  if (!d3plus.ie) console.time(message)
}
d3plus.console.timeEnd = function(message) {
  if (!d3plus.ie) console.timeEnd(message)
}
