# Detects is the current browser supports touch events
module.exports = if ("ontouchstart" of window) or window.DocumentTouch and document instanceof DocumentTouch then true else false
