defaultScale = require("./scale.coffee")

# Returns a random color
module.exports = (x, scale) ->
  rand_int = x or Math.floor(Math.random() * 20)
  scale = scale or defaultScale
  scale rand_int
