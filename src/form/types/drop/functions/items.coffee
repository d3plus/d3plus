active = require("./active.js")
copy   = require("../../../../util/copy.coffee")
form   = require("../../../form.js")
print  = require("../../../../core/console/print.coffee")

# Populates item list based on filtered data.
module.exports = (vars) ->

  if vars.open.value

    print.time "updating list items" if vars.dev.value

    unless "items" of vars.container
      vars.container.items = form()
        .container vars.container.list
        .type "button"
        .ui
          border:  0
          display: "block"
          margin:  0
        .width(false)

    large       = if vars.draw.timing then vars.data.large else 1
    order       = copy vars.order
    order.value = if vars.search.term.length then "d3plus_order" else vars.order.value
    deepest     = vars.depth.value is vars.id.nesting.length - 1

    if vars.focus.changed or vars.container.items.focus() is false

      vars.container.items
        .focus vars.focus.value, (value) ->

          data = vars.data.filtered.filter((f) ->
            f[vars.id.value] is value
          )[0]

          if vars.depth.value < vars.id.nesting.length - 1 and vars.id.nesting[vars.depth.value + 1] of data
            depth = vars.depth.value
            solo = vars.id.solo.value
            vars.history.states.push -> vars.self.depth(depth).id(solo: solo).draw()
            vars.self.depth(vars.depth.value + 1).id(solo: [value]).draw()
          else
            unless vars.depth.changed
              vars.self.open(false)
            change = value isnt vars.focus.value
            change = active(vars, value) if change and vars.active.value
            vars.self.focus(value).draw() if change

          return

    if vars.data.changed
      vars.container.items
          .data
            large: large
            value: vars.data.filtered

    vars.container.items
      .active vars.active.value
      .data {"sort": vars.data.sort.value}
      .draw
        update: vars.draw.update
      .font vars.font.secondary
      .format vars.format
      .hover vars.hover.value
      .id vars.id.value
      .icon
        button: (if deepest then false else vars.icon.next)
        select: (if deepest then vars.icon.select else false)
        value:  vars.icon.value
      .order order
      .text vars.text.secondary.value or vars.text.value
      .timing
        ui: vars.draw.timing
      .ui
        color:
          primary:   (if vars.id.nesting.length is 1 then vars.ui.color.primary.value else vars.ui.color.secondary.value)
          secondary: vars.ui.color.secondary.value
        padding: vars.ui.padding.css
      .draw()

    print.timeEnd "updating list items" if vars.dev.value

  return
