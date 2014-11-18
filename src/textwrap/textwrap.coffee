attach     = require "../core/methods/attach.coffee"
dimensions = require "./helpers/getDimensions.coffee"
print     = require "../core/console/print.coffee"
size       = require "./helpers/getSize.coffee"
text       = require "./helpers/getText.coffee"
wrap       = require "./helpers/wrap.coffee"

# Word wraps SVG text
module.exports = ->

  # Main drawing function
  vars =
    self: (selection) ->

      selection.each ->

        dimensions vars
        size vars

        if vars.size.value[0] <= vars.height.value
          text vars
          wrap vars

        print.timeEnd "total draw time" if vars.dev.value

        return

      vars.self


  # Define methods and expose public variables.
  attach vars,
    config:    require "./methods/config.coffee"
    container: require "./methods/container.coffee"
    dev:       require "./methods/dev.coffee"
    draw:      require "./methods/draw.coffee"
    format:    require "./methods/format.coffee"
    height:    require "./methods/height.coffee"
    resize:    require "./methods/resize.coffee"
    text:      require "./methods/text.coffee"
    shape:     require "./methods/shape.coffee"
    size:      require "./methods/size.coffee"
    width:     require "./methods/width.coffee"

  vars.self
