var vizwhiz = window.vizwhiz || {};

vizwhiz.version = '0.0.1';
vizwhiz.dev = true //set false when in production

window.vizwhiz = vizwhiz;

vizwhiz.tooltip = {}; // For the tooltip system
vizwhiz.utils = {}; // Utility subsystem
vizwhiz.viz = {}; //stores all the possible visualizations
vizwhiz.evt = {}; // stores all mouse events that could occur

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
  vizwhiz.evt.over = 'mouseover'
  vizwhiz.evt.out = 'mouseout'
  vizwhiz.evt.move = 'mousemove'
}