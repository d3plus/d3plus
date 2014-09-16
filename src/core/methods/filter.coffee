module.exports = (g) ->

  g = false unless g

  accepted: [Array, Boolean, Function, Number, Object, String]
  global:   g
  process:  Array
  value:    []
