d3plus.method.coords = {
  "accepted": [ Array , Boolean , Function , Object , String ],
  "center": [0,0],
  "fit": {
    "accepted": ["auto","height","width"],
    "value": "auto"
  },
  "mute": d3plus.method.filter(false),
  "padding": 20,
  "process": d3plus.method.processData,
  "projection": {
    "accepted": ["mercator","equirectangular"],
    "value": "mercator"
  },
  "solo": d3plus.method.filter(false),
  "threshold": 0.1,
  "value": false
}
