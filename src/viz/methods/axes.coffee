process = require "../../core/methods/process/margin.coffee"
rendering = require "../../core/methods/rendering.coffee"

module.exports =
  background:
    color:     "#fafafa"
    rendering: rendering()
    stroke:
      color: "#ccc"
      width: 1
  margin:
    accepted: [Number, Object, String]
    process:  (value) ->

      value     = @value if value is undefined
      userValue = value
      process value, this
      userValue

    value: 10
  mirror:
    accepted:   [Boolean]
    deprecates: ["mirror_axis", "mirror_axes"]
    value:      false
  ticks:
    accepted:   [Boolean]
    value:      true
