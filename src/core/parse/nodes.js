var print = require("../console/print.coffee")

// Calculates node positions, if needed for network.
module.exports = function(vars) {

  if ( vars.dev.value ) {
    var timerString = "analyzing node positions"
    print.time( timerString )
  }

  var set = vars.nodes.value.filter(function(n){
    return typeof n.x == "number" && typeof n.y == "number"
  }).length

  if (set == vars.nodes.value.length) {
    vars.nodes.positions = true
  }
  else {

    var force = d3.layout.force()
      .size([vars.width.viz,vars.height.viz])
      .nodes(vars.nodes.value)
      .links(vars.edges.value)

    var strength = vars.edges.strength.value
    if (strength) {
      if (typeof strength === "string") {
        force.linkStrength(function(e){
          return e[strength]
        })
      }
      else {
        force.linkStrength(strength)
      }
    }

    var iterations = 50,
        threshold = 0.01;

    force.start(); // Defaults to alpha = 0.1
    for (var i = iterations; i > 0; --i) {
      force.tick();
      if(force.alpha() < threshold) {
        break;
      }
    }
    force.stop();

    vars.nodes.positions = true

  }

  if ( vars.dev.value ) print.timeEnd( timerString )

}
