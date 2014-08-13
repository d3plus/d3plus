d3plus.method.time = {
  "accepted"    : [ Array , Boolean , Function , Object , String ],
  "dataFilter"  : true,
  "deprecates"  : [ "year" , "year_var" ],
  "fixed"       : {
    "accepted"   : [ Boolean ],
    "deprecates" : [ "static_axis" , "static_axes" ],
    "value"      : true
  },
  "format"      : {
    "accepted" : [false, String],
    "value"    : false
  },
  "mute"        : d3plus.method.filter(false),
  "solo"        : d3plus.method.filter(false),
  "value"       : false
}
