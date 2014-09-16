module.exports = (align) ->

  align = "left" unless align

  accepted: ["left", "center", "right"]
  process: (value) ->
    if d3plus.rtl
      if value is "left"
        "right"
      else
        if value is "right"
          "left"
        else value
    else value
  value: align
