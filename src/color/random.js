//^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// Random color generator
//------------------------------------------------------------------------------
d3plus.color.random = function(x,scale) {
  var rand_int = x || Math.floor(Math.random()*20)
    , scale = scale || d3plus.color.scale
  return scale(rand_int)
}
