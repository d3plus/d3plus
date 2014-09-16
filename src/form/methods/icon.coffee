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
  button:
    accepted: [false, String]
    fallback: false
    opacity:  1
    process:  process
    rotate:   0
    value:    false
  drop:
    accepted: [false, String]
    fallback: "&#x276f;"
    opacity:  1
    process:  process
    rotate:   0
    value:    "fa-angle-down"
  next:
    accepted: [false, String]
    fallback: "&#x276f;"
    opacity:  1
    process:  process
    rotate:   0
    value:    "fa-angle-right"
  select:
    accepted: [false, String]
    fallback: "&#x2713;"
    opacity:  1
    process:  process
    rotate:   0
    value:    "fa-check"
  style:
    accepted: [Object, String]
    value:    "default"
  value: "icon"
