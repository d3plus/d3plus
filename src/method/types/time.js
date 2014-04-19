d3plus.method.time = {
  "accepted": [ Array , Boolean , Function , Object , String ],
  "data_filter": true,
  "deprecates": [ "year" , "year_var" ],
  "fixed": {
    "accepted": [ Boolean ],
    "deprecates": [ "static_axis" , "static_axes" ],
    "value": true
  },
  "mute": d3plus.method.filter(false),
  "solo": d3plus.method.filter(false),
  "value": false
}
