d3plus.method.color = {
  "accepted"   : [ false , Array , Function , Object , String ],
  "deprecates" : "color_var",
  "init"       : function ( vars ) {

    if ( vars.shell === "form" ) {
      return "color"
    }
    else {
      return false
    }

  },
  "mute"      : d3plus.method.filter(true),
  "solo"      : d3plus.method.filter(true)
}
