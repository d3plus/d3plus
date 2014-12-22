#^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
# Flows the text into tspans
#------------------------------------------------------------------------------
module.exports = (vars) ->

  newLine = (w) ->
    w = "" unless w
    vars.container.value.append("tspan")
      .attr "x", xPosition
      .attr "dy", fontSize
      .text w

  xPosition = vars.container.value.attr("x") or "0px"
  words = vars.text.words.slice(0)
  progress = words[0]
  fontSize = if vars.resize.value then vars.size.value[1] + "px" else vars.container.fontSize or vars.size.value[0] + "px"
  textBox = newLine words.shift()
  textHeight = textBox.node().offsetHeight or textBox.node().getBoundingClientRect().height
  line = 1

  if vars.shape.value is "circle"
    vars.container.value.attr "text-anchor", "middle"

  truncate = ->
    textBox.remove()
    line--
    if line isnt 1
      textBox = d3.select(vars.container.value.node().lastChild)
    unless textBox.empty()
      words = textBox.text().match(/[^\s-]+-?/g)
      ellipsis()
    return

  lineWidth = () ->
    if vars.shape.value is "circle"
      b = (line - 1) * textHeight
      2 * Math.sqrt(b * ((2 * (vars.width.value / 2)) - b))
    else
      vars.width.value

  ellipsis = ->
    if words and words.length
      lastWord = words.pop()
      lastChar = lastWord.charAt(lastWord.length - 1)
      if lastWord.length is 1 and vars.text.split.value.indexOf(lastWord) >= 0
        ellipsis()
      else
        if vars.text.split.value.indexOf(lastChar) >= 0
          lastWord = lastWord.substr(0, lastWord.length - 1)
        textBox.text words.join(" ") + " " + lastWord + " ..."
        ellipsis() if textBox.node().getComputedTextLength() > lineWidth()
    else
      truncate()
      return

  placeWord = (word) ->

    current   = textBox.text()
    lastChar  = current.slice(-1)
    next_char = vars.text.current.charAt(progress.length)
    joiner    = if next_char is " " then " " else ""
    textBox.text current + joiner + word
    progress += joiner + word

    if textBox.node().getComputedTextLength() > lineWidth()
      textBox.text current
      textBox = newLine(word)
      line++

  for word in words

    if line * textHeight > vars.height.value
      truncate()
      break

    placeWord word

    unsafe = true
    while unsafe
      next_char = vars.text.current.charAt(progress.length + 1)
      unsafe = vars.text.split.value.indexOf(next_char) >= 0
      placeWord next_char if unsafe
