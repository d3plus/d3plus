attach    = require "../core/methods/attach.coffee"
axis      = require "./methods/helpers/axis.coffee"
flash     = require "./helpers/ui/message.js"
getSteps  = require "./helpers/drawSteps.js"
print     = require "../core/console/print.coffee"
container = require "./helpers/container.coffee"

module.exports = ->

  vars =
    g: {apps: {}}
    types:
      bar:      require "./types/bar.coffee"
      bubbles:  require "./types/bubbles.coffee"
      box:      require "./types/box.coffee"
      chart:    require "./types/deprecated/chart.coffee"
      geo_map:  require "./types/geo_map.coffee"
      line:     require "./types/line.coffee"
      network:  require "./types/network.js"
      paths:    require "./types/paths.coffee"
      pie:      require "./types/pie.coffee"
      rings:    require "./types/rings.js"
      scatter:  require "./types/scatter.coffee"
      stacked:  require "./types/stacked.coffee"
      table:    require "./types/table.js"
      tree_map: require "./types/tree_map.coffee"

  # Main drawing function
  vars.self = (selection) ->

    selection.each ->

      vars.draw.frozen    = true
      vars.internal_error = null
      vars.draw.timing    = vars.timing.transitions unless "timing" of vars.draw

      # Analyze Container
      container vars if vars.container.changed

      # Determine if in "small" mode
      small_width     = vars.width.value <= vars.width.small
      small_height    = vars.height.value <= vars.height.small
      vars.small      = small_width or small_height
      vars.width.viz  = vars.width.value
      vars.height.viz = vars.height.value
      lastMessage     = false

      if vars.error.value
        timing = vars.draw.timing
        vars.group.transition().duration(timing).attr "opacity", 0
        vars.g.data.transition().duration(timing).attr "opacity", 0
        vars.g.edges.transition().duration(timing).attr "opacity", 0
        vars.messages.style = "large"
        message             = if vars.error.value is true then vars.format.value(vars.format.locale.value.ui.error) else vars.error.value
        lastMessage         = message
        flash vars, message
      else

        nextStep = ->
          if steps.length
            runStep()
          else
            vars.methodGroup = false
            if vars.dev.value
              print.timeEnd "total draw time"
              print.groupEnd()
              print.log "\n"
          return

        runFunction = (step, name) ->

          name = name or "function"
          if step[name] instanceof Array
            step[name].forEach (f) ->
              f vars, nextStep
              return
          else step[name] vars, nextStep if typeof step[name] is "function"
          nextStep() unless step.wait
          return

        runStep = ->

          step = steps.shift()
          same = vars.g.message and lastMessage is step.message
          run  = if "check" of step then step.check else true
          run  = run(vars) if typeof run is "function"

          if run
            if not same and vars.draw.update
              if vars.dev.value
                print.groupEnd()  if lastMessage isnt false
                print.groupCollapsed step.message
              lastMessage = (if typeof vars.messages.value is "string" then vars.messages.value else step.message)
              message = (if typeof vars.messages.value is "string" then vars.messages.value else vars.format.value(step.message))
              flash vars, message
              setTimeout (->
                runFunction step
                return
              ), 10
            else
              runFunction step
          else
            if "otherwise" of step
              setTimeout (->
                runFunction step, "otherwise"
                return
              ), 10
            else
              nextStep()
          return

        vars.messages.style = if vars.group and vars.group.attr("opacity") is "1" then "small" else "large"

        steps = getSteps vars

        runStep()

      return

    vars.self


  # Define methods and expose public methods.
  attach vars,
    active:     require "./methods/active.coffee"
    aggs:       require "./methods/aggs.coffee"
    attrs:      require "./methods/attrs.coffee"
    axes:       require "./methods/axes.coffee"
    background: require "./methods/background.coffee"
    color:      require "./methods/color.coffee"
    cols:       require "./methods/cols.js"
    container:  require "./methods/container.coffee"
    coords:     require "./methods/coords.coffee"
    csv:        require "./methods/csv.coffee"
    data:       require "./methods/data.js"
    depth:      require "./methods/depth.coffee"
    descs:      require "./methods/descs.coffee"
    dev:        require "./methods/dev.coffee"
    draw:       require "./methods/draw.js"
    edges:      require "./methods/edges.js"
    error:      require "./methods/error.coffee"
    focus:      require "./methods/focus.coffee"
    font:       require "./methods/font.coffee"
    footer:     require "./methods/footer.coffee"
    format:     require "./methods/format.coffee"
    height:     require "./methods/height.coffee"
    history:    require "./methods/history.coffee"
    icon:       require "./methods/icon.coffee"
    id:         require "./methods/id.coffee"
    labels:     require "./methods/labels.coffee"
    legend:     require "./methods/legend.coffee"
    links:      require "./methods/links.coffee"
    margin:     require "./methods/margin.coffee"
    messages:   require "./methods/messages.coffee"
    nodes:      require "./methods/nodes.coffee"
    order:      require "./methods/order.coffee"
    shape:      require "./methods/shape.coffee"
    size:       require "./methods/size.coffee"
    style:      require "./methods/style.coffee"
    temp:       require "./methods/temp.coffee"
    text:       require "./methods/text.coffee"
    time:       require "./methods/time.coffee"
    timeline:   require "./methods/timeline.coffee"
    timing:     require "./methods/timing.coffee"
    title:      require "./methods/title.coffee"
    tooltip:    require "./methods/tooltip.coffee"
    total:      require "./methods/total.coffee"
    type:       require "./methods/type.coffee"
    ui:         require "./methods/ui.coffee"
    width:      require "./methods/width.coffee"
    x:          axis "x"
    y:          axis "y"
    zoom:       require "./methods/zoom.js"

  vars.self
