d3plus.method.color = {
  "accepted": [ Array , Boolean , Function , Object , String ],
  "deprecates": ["color_var"],
  "init": function ( vars ) {

    if ( vars.shell === "form" ) {
      return "color"
    }
    else {
      return false
    }

  },
  "mute": d3plus.method.filter(true),
  "solo": d3plus.method.filter(true)
}
