rtl = require "../../../client/rtl.coffee"

module.exports = (align) ->

  accepted = ["left", "center", "right"]
  accepted.unshift false if align is false
  align = "left" if accepted.indexOf(align) < 0

  accepted: accepted
  process: (value) ->
    if rtl
      if value is "left"
        "right"
      else
        if value is "right"
          "left"
        else value
    else value
  value: align
