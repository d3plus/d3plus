# Fetches text if not specified, and formats text to array.
module.exports = (vars) ->

  # Parses text from container element, unless specified.
  unless vars.text.value
    text = vars.container.value.text()
    if text
      if text.indexOf("tspan") >= 0
        text.replace /\<\/tspan\>\<tspan\>/g, " "
        text.replace /\<\/tspan\>/g, ""
        text.replace /\<tspan\>/g, ""
      text = text.replace /(\r\n|\n|\r)/gm, ""
      text = text.replace /^\s+|\s+$/g, ""
      vars.self.text text

  # Creates an array of "fallback phrases".
  if vars.text.value instanceof Array
    vars.text.phrases = vars.text.value.filter (t) -> ["string", "number"].indexOf(typeof t) >= 0
  else
    vars.text.phrases = [vars.text.value + ""]

  # Detects text-align if not specified with .align( )
  unless vars.align.value
    vars.container.align = vars.container.value.style("text-anchor") or
                           vars.container.value.attr("text-anchor")
