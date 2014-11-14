process = require "../../core/methods/process/icon.coffee"

module.exports =
  accepted: [false, Array, Function, Object, String]
  back:
    accepted: [false, String]
    fallback: "&#x276e;"
    opacity:  1
    process:  process
    rotate:   0
    value:    "fa-angle-left"
  deprecates: "icon_var"
  style:
    accepted:   [Object, String]
    deprecates: "icon_style"
    value:      "default"
  value: false
