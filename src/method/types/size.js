d3plus.method.size = {
  "accepted"    : [ Array , Boolean , Function , Object , String ],
  "dataFilter"  : true,
  "deprecates"  : [ "value" , "value_var" ],
  "mute"        : d3plus.method.filter(true),
  "scale"       : {
    "accepted"   : [ Function ],
    "deprecates" : "size_scale",
    "value"      : d3.scale.sqrt()
  },
  "solo"        : d3plus.method.filter(true),
  "threshold"   : true,
  "value"       : false
}
