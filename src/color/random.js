//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
d3plus.color.random = function(x) {
  var rand_int = x || Math.floor(Math.random()*20)
  return d3plus.color.scale.default(rand_int)
}
