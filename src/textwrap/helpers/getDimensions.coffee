# Checks width and height, and gets it if needed.
module.exports = (vars) ->

  if not vars.width.value or not vars.height.value

    prev  = vars.container.value.node().previousElementSibling
    shape = if prev then prev.tagName.toLowerCase() else ""
    prev  = d3.select(prev) if prev

    if shape is "rect"
      unless vars.width.value
        width = prev.attr "width" or prev.style "width"
        vars.self.width parseFloat width, 10
      unless vars.height.value
        height = prev.attr "height" or prev.style "height"
        vars.self.height parseFloat height, 10
    else if shape is "circle"
      radius = prev.attr "r"
      vars.self.width parseFloat(radius) * 2, 10 unless vars.width.value
      vars.self.height parseFloat(radius) * 2, 10 unless vars.height.value
    else
      vars.self.width 500 unless vars.width.value
      vars.self.height 500 unless vars.height.value

  return
