var d3plus = window.d3plus || {};
window.d3plus = d3plus;

d3plus.version = "1.2.4 - Royal";

d3plus.ie = /*@cc_on!@*/false;

d3plus.rtl = d3.select("html").attr("dir") == "rtl"

d3plus.prefix = function() {

  if ("-webkit-transform" in document.body.style) {
    var val = "-webkit-"
  }
  else if ("-moz-transform" in document.body.style) {
    var val = "-moz-"
  }
  else if ("-ms-transform" in document.body.style) {
    var val = "-ms-"
  }
  else if ("-o-transform" in document.body.style) {
    var val = "-o-"
  }
  else {
    var val = ""
  }

  d3plus.prefix = function(){
    return val
  }

  return val;

}

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
  d3plus.prefix()
  d3plus.scrollbar()
})

d3plus.evt = {}; // stores all mouse events that could occur

// Modernizr touch events
d3plus.touch = window.Modernizr && Modernizr.touch
if (d3plus.touch) {
  d3plus.evt.click = "click"
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

d3plus.visualization = {};
d3plus.color = {};
d3plus.data = {};
d3plus.draw = {};
d3plus.font = {};
d3plus.forms = {};
d3plus.method = {};
d3plus.shape = {};
d3plus.styles = {};
d3plus.tooltip = {};
d3plus.ui = {};
d3plus.util = {};
d3plus.variable = {};
d3plus.zoom = {};
