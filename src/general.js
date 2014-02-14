var d3plus = window.d3plus || {};
window.d3plus = d3plus;

d3plus.version = "1.1.6 - Navy";

d3plus.ie = /*@cc_on!@*/false;

d3plus.fontawesome = false

var sheets = document.styleSheets
    
for (var s = 0; s < sheets.length; s++) {
  if (sheets[s].href && sheets[s].href.indexOf("font-awesome") >= 0) {
    d3plus.fontawesome = true
    break;
  }
}

d3plus.rtl = d3.select("html").attr("dir") == "rtl"

d3plus.scrollbar = function() {
  
  var inner = document.createElement("p");
  inner.style.width = "100%";
  inner.style.height = "200px";

  var outer = document.createElement("div");
  outer.style.position = "absolute";
  outer.style.top = "0px";
  outer.style.left = "0px";
  outer.style.visibility = "hidden";
  outer.style.width = "200px";
  outer.style.height = "150px";
  outer.style.overflow = "hidden";
  outer.appendChild(inner);

  document.body.appendChild(outer);
  var w1 = inner.offsetWidth;
  outer.style.overflow = "scroll";
  var w2 = inner.offsetWidth;
  if (w1 == w2) w2 = outer.clientWidth;

  document.body.removeChild(outer);
  
  var val = (w1 - w2)
  
  d3plus.scrollbar = function(){
    return val
  }
  
  return val;
  
}

d3.select(window).on("load.d3plus_scrollbar",function(){
  d3plus.scrollbar()
})

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
d3plus.forms = {};
d3plus.info = {};
d3plus.shape = {};
d3plus.styles = {};
d3plus.tooltip = {};
d3plus.utils = {};
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
