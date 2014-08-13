###*
 * Returns a random color
 ###
d3plus.color.random = (x, scale) ->
  rand_int = x or Math.floor(Math.random() * 20)
  scale = scale or d3plus.color.scale
  scale rand_int
