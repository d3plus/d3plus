module.exports =
  accepted: [Boolean]
  value: false
  timeout: 400
  process: (value, vars) ->
    if !value
      return false

    resize = null

    resizeEnd = ->
      mainNode = vars.container.value.node().parentNode.getBoundingClientRect()

      width = mainNode.width
      height = mainNode.height

      vars.self.width(width)
      vars.self.height(height)

      vars.self.draw() if vars.width.changed or vars.height.changed

    d3.select(window).on("resize." + vars.container.id, (e) =>
      clearTimeout resize
      resize = setTimeout resizeEnd, this.timeout
    )

    value
