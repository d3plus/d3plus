module.exports = {
  "accepted" : [ Boolean ],
  "value"    : false,
  "timeout": 400,
  "process"  : (value, vars) ->
    if !value
      return false

    resize = null;

    resizeEnd = ->
      mainNode = vars.container.value.node().parentNode.getBoundingClientRect()

      width = mainNode.width
      height = mainNode.height

      vars.width.value = width
      vars.height.value = height

      vars.self(vars.container.value)

    d3.select(window).on("resize." + vars.container.id, (e) =>
      clearTimeout resize
      resize = setTimeout resizeEnd, this.timeout
    )

    return value
}
