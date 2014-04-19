d3plus.method.zoom = {
  "accepted": [ Boolean ],
  "behavior": d3.behavior.zoom().scaleExtent([ 1 , 1 ]),
  "click": {
    "accepted": [ Boolean ],
    "value": true
  },
  "pan": {
    "accepted": [ Boolean ],
    "value": true
  },
  "scroll": {
    "accepted": [ Boolean ],
    "value": true,
    "deprecates": ["scroll_zoom"]
  },
  "value": true
}
