module.exports = (g) ->

  g = false unless g

  accepted: [false, Array, Function, Number, Object, String]
  global:   g
  process:  Array
  value:    []
