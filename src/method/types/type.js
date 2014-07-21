d3plus.method.type = {
  "accepted" : function( vars ) {
    return d3.keys(vars.types)
  },
  "init"     : function ( vars ) {

    var shell = vars.shell

    if ( shell === "viz" ) {
      return "tree_map"
    }
    else if ( shell === "form" ) {
      return "auto"
    }
    else {
      return undefined
    }

  },
  "mode"     : {
    "accepted" : function(vars){
      return vars.types[vars.type.value].modes || [ false ]
    },
    "value"    : false
  }
}
