# Assigns behavior to the user's keyboard for navigation.
module.exports = (vars) ->

  d3.select(window).on "keydown." + vars.container.id, ->

    key = d3.event.keyCode

    if vars.open.value or vars.hover.value is true

      matchKey = if vars.hover.value is true then "focus" else "hover"
      index    = false

      for d, i in vars.data.filtered
        if d[vars.id.value] is vars[matchKey].value
          index = i
          break

      # Tab
      if key is 9 and vars.open.value and (!vars.search.enabled or
         (vars.search.enabled and !d3.event.shiftKey))
        vars.self.open(false).hover(false).draw()

      # Up/Down
      else if [38,40].indexOf(key) >= 0

        if index is false
          index = 0
        else if key is 38
          if vars.open.value
            if index <= 0
              index = vars.data.filtered.length - 1
            else
              index -= 1
        else if key is 40
          if vars.open.value
            if index >= vars.data.filtered.length - 1
              index = 0
            else
              index += 1

        if typeof vars.hover.value isnt "boolean"
          hover = vars.data.filtered[index][vars.id.value]
        else
          hover = vars.focus.value

        vars.self.hover(hover).open(true).draw()

      # Enter/Return
      else if key is 13
        if typeof vars.hover.value isnt "boolean"
          data = vars.data.filtered.filter((f) ->
            f[vars.id.value] is vars.hover.value
          )[0]
          depth = vars.depth.value
          if depth < vars.id.nesting.length - 1 and
             vars.id.nesting[depth + 1] of data
            solo = vars.id.solo.value
            hist = -> vars.self.depth(depth).id(solo: solo).draw()
            vars.history.states.push hist
            vars.self.depth(vars.depth.value + 1)
              .id(solo: [vars.hover.value]).draw()
          else
            vars.self.focus(vars.hover.value).hover(true).draw()
        else
          vars.self.hover(vars.focus.value).open(true).draw()

      # ESC
      else if key is 27
        if vars.open.value
          vars.self.open(false).hover(true).draw()
        else if vars.hover.value is true
          vars.self.hover(false).draw()
