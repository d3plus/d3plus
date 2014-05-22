d3plus.method.text = {
  "accepted"   : [ Array , Boolean , Function , Object , String ],
  "deprecates" : [ "name_array" , "text_var" ],
  "mute"       : d3plus.method.filter(true),
  "solo"       : d3plus.method.filter(true),
  "nesting"    : true,
  "secondary"  : {
    "accepted" : [ Array , Boolean , Function , Object , String ],
    "nesting"  : true,
    "value"    : false
  },
  "value"      : "text"
}
