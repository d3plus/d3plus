module.exports = {
  "accepted"   : [ Boolean ],
  "behavior"   : d3.behavior.zoom().scaleExtent([ 1 , 1 ]).duration(0),
  "click"      : {
    "accepted" : [ Boolean ],
    "value"    : true
  },
  "pan"        : {
    "accepted" : [ Boolean ],
    "value"    : true
  },
  "scroll"     : {
    "accepted"   : [ Boolean ],
    "deprecates" : "scroll_zoom",
    "value"      : true
  },
  "value"      : true
}
