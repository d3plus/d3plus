attach = require "../core/methods/attach.coffee"
sizes  = require "./helpers/parseSize.coffee"
print  = require "../core/console/print.coffee"
text   = require "./helpers/parseText.coffee"
wrap   = require "./helpers/wrap.coffee"

# Word wraps SVG text
module.exports = ->

  # Main drawing function
  vars =
    self: (selection) ->

      selection.each ->

        sizes vars
        if vars.size.value[0] <= vars.height.inner
          text vars
          wrap vars
        else
          vars.container.value.html("")

        print.timeEnd "total draw time" if vars.dev.value

        return

      vars.self


  # Define methods and expose public variables.
  attach vars,
    align:     require "./methods/align.coffee"
    config:    require "./methods/config.coffee"
    container: require "./methods/container.coffee"
    dev:       require "./methods/dev.coffee"
    draw:      require "./methods/draw.coffee"
    format:    require "./methods/format.coffee"
    height:    require "./methods/height.coffee"
    padding:   require "./methods/padding.coffee"
    resize:    require "./methods/resize.coffee"
    rotate:    require "./methods/rotate.coffee"
    text:      require "./methods/text.coffee"
    shape:     require "./methods/shape.coffee"
    size:      require "./methods/size.coffee"
    valign:    require "./methods/valign.coffee"
    width:     require "./methods/width.coffee"
    x:         require "./methods/x.coffee"
    y:         require "./methods/y.coffee"

  vars.self
