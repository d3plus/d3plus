# Checks width and height, and gets it if needed.
module.exports = (vars) ->

  if not vars.width.value or not vars.height.value

    parent = d3.select vars.container.value.node().parentNode
    rect   = parent.select "rect"
    circle = parent.select "circle"

    unless rect.empty()
      unless vars.width.value
        width = rect.attr "width" or rect.style "width"
        vars.self.width parseFloat width, 10
      unless vars.height.value
        height = rect.attr "height" or rect.style "height"
        vars.self.height parseFloat height, 10
    else unless circle.empty()
      radius = circle.attr "r"
      vars.self.width parseFloat radius * 2, 10 unless vars.width.value
      vars.self.height parseFloat radius * 2, 10 unless vars.height.value
    else
      vars.self.width 500 unless vars.width.value
      vars.self.height 500 unless vars.height.value

  return
