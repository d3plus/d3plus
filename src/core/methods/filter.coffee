module.exports = (g) ->

  g = false unless g

  accepted: [false, Array, Function, Number, Object, String]
  callback:
    accepted: [false, Function]
    value:    false
  global:   g
  process:  Array
  value:    []
