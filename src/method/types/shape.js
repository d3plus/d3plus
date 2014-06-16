d3plus.method.shape = {
  "accepted" : function( vars ) {
    return vars.shell === "textwrap" ? [ "circle" , "square" ]
         : [ "circle" , "donut" , "line"
         , "square" , "area" , "coordinates" ]
  },
  "value"    : false
}
