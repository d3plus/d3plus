# Overrides keyboard behavior of the original input element.
module.exports = (vars) ->

  if vars.data.element.value

    vars.data.element.value.on "focus." + vars.container.id, ->
      vars.self.hover(true).draw()

    vars.data.element.value.on "blur." + vars.container.id, ->
      if vars.search.enabled
        search = d3.event.relatedTarget isnt vars.container.value.select('input').node()
      else
        search = true
      vars.self.open(false).hover(false).draw() if search

    vars.data.element.value.on "change." + vars.container.id, ->
      vars.self.focus(@value).draw()

    vars.data.element.value.on "keydown.cancel_" + vars.container.id, ->
      d3.event.preventDefault() if d3.event.keyCode isnt 9
