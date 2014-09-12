# Detects is the current browser supports touch events
d3plus.touch = if ("ontouchstart" of window) or window.DocumentTouch and document instanceof DocumentTouch then true else false

module.exports = d3plus.touch
