filter = require "../../core/methods/filter.coffee"

module.exports =
  accepted:   [false, Function, Number, Object, String]
  dataFilter: true
  deprecates: ["value", "value_var"]
  mute:       filter(true)
  scale:
    accepted:   [Function]
    deprecates: "size_scale"
    max:
      accepted: [Function, Number]
      value:    (vars) ->
        Math.floor d3.max [d3.min([vars.width.viz,vars.height.viz])/15, 6]
    min:
      accepted: [Function, Number]
      value:    3
    value:      d3.scale.sqrt()
  solo:       filter(true)
  threshold:
    accepted: [Boolean, Function, Number]
    value:    false
  value:      false
