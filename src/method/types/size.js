d3plus.method.size = {
  "accepted"    : function( vars ) {

    if ( vars.shell === "textwrap" ) {
      return [ Array ]
    }
    else {
      return [ Array , Boolean , Function , Object , String ]
    }

  },
  "dataFilter"  : true,
  "deprecates"  : [ "value" , "value_var" ],
  "init"        : function( vars ) {

    if ( vars.shell === "textwrap" ) {
      return [ 9 , 40 ]
    }
    else {
      return false
    }

  },
  "mute"        : d3plus.method.filter(true),
  "scale"       : {
    "accepted"   : [ Function ],
    "deprecates" : "size_scale",
    "value"      : d3.scale.sqrt()
  },
  "solo"        : d3plus.method.filter(true),
  "threshold"   : true
}
