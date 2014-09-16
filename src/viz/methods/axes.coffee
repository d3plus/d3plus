family = require "../../core/methods/font/family.coffee"

module.exports =
  mirror:
    accepted: [Boolean]
    deprecates: ["mirror_axis", "mirror_axes"]
    value: false
  ticks:
    color: "#ccc"
    font:
      color: "#888"
      decoration:
        accepted: ["line-through", "none", "overline", "underline"]
        value: "none"
      family: family()
      size: 10
      transform:
        accepted: ["capitalize", "lowercase", "none", "uppercase"]
        value: "none"
      weight: 200
    size: 10
    width: 1
