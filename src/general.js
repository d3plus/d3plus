var vizwhiz = window.vizwhiz || {};

vizwhiz.version = '0.0.1';

window.vizwhiz = vizwhiz;

vizwhiz.timing = 600; // milliseconds for animations

vizwhiz.tooltip = {}; // For the tooltip system
vizwhiz.utils = {}; // Utility subsystem
vizwhiz.evt = {}; // stores all mouse events that could occur

vizwhiz.ie = /*@cc_on!@*/false;

// Modernizr touch events
if (Modernizr.touch) {
  vizwhiz.evt.click = 'touchend'
  vizwhiz.evt.down = 'touchstart'
  vizwhiz.evt.up = 'touchend'
  vizwhiz.evt.over = 'touchstart'
  vizwhiz.evt.out = 'touchend'
  vizwhiz.evt.move = 'touchmove'
} else {
  vizwhiz.evt.click = 'click'
  vizwhiz.evt.down = 'mousedown'
  vizwhiz.evt.up = 'mouseup'
  if (vizwhiz.ie) {
    vizwhiz.evt.over = 'mouseenter'
    vizwhiz.evt.out = 'mouseleave'
  }
  else {
    vizwhiz.evt.over = 'mouseover'
    vizwhiz.evt.out = 'mouseout'
  }
  vizwhiz.evt.move = 'mousemove'
}
