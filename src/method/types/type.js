d3plus.method.type = {
  "accepted": function( vars ) {

    var shell = vars.shell

    if ( shell === "viz" ) {
      return d3.keys(d3plus.visualization)
    }
    else if ( shell === "form" ) {
      return d3.keys(d3plus.input)
    }
    else {
      return []
    }

  },
  "init": function ( vars ) {

    var shell = vars.shell

    if ( shell === "viz" ) {
      return "tree_map"
    }
    else if ( shell === "form" ) {
      return "drop"
    }
    else {
      return undefined
    }

  },
  "mode": {
    "accepted": [ "squarify" , "slice" , "dice" , "slice-dice" ],
    "value": "squarify"
  }
}
