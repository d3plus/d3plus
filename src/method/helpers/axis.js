//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Create dummy methods to catch deprecates
//--------------------------------------------------------------------------
d3plus.method.axis = function( axis ) {

  var axis = axis || "x"

  return {
    "accepted": [ Array , Boolean , Function , Object , String ],
    "data_filter": true,
    "deprecates": [ axis+"axis" , axis+"axis_val" , axis+"axis_var" ],
    "domain": false,
    "lines": [],
    "mute": d3plus.method.filter(true),
    "range": false,
    "reset": [ "range" ],
    "scale": {
      "accepted": [ "linear" , "log" , "continuous" , "share" ],
      "value": "linear",
      "deprecates": [ "layout" , "unique_axis" , "yaxis_scale" ]
    },
    "solo": d3plus.method.filter(true),
    "stacked": {
      "accepted": [ Boolean ],
      "value": false
    },
    "value": false,
    "zerofill": {
      "accepted": [ Boolean ],
      "value": false
    }
  }

}
